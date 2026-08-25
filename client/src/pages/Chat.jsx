// =====================================================================
// Chat page — messaging with sidebar, emoji, camera, press-hold voice
// Uses REST for reliable sending + display.
// =====================================================================
import { useEffect, useState, useRef } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const EMOJIS = [
  "😀", "😂", "😍", "😎", "🤔", "👍", "👏", "🎉", "❤️", "😢",
  "😡", "🤗", "🙏", "💪", "😴", "🤯", "🥳", "😇", "🙌", "👌",
  "🛒", "💸", "💰", "🏠", "🍕", "☕", "🚗", "🎁", "💡", "⚠️",
];

const SHORTCUTS = { ":)": "😀", ":(": "😢", ":D": "😁", "<3": "❤️", ":P": "😛" };

export default function Chat() {
  const { family, view } = useFamily();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false); // camera / gallery menu
  const [uploadingPhoto, setUploadingPhoto] = useState(false); // photo is being sent
  const [recording, setRecording] = useState(false);

  // Two hidden file inputs: one forces the phone camera, one opens the gallery.
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordStartRef = useRef(null); // timestamp when recording started
  const bottomRef = useRef(null);

  const USER_COLORS = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b", "#f472b6", "#a78bfa"];

  function colorFor(name) {
    if (!name) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
    return USER_COLORS[hash % USER_COLORS.length];
  }

  function isImageMessage(msg) {
    return typeof msg.message === "string" && msg.message.startsWith("data:image");
  }
  function isVoiceMessage(msg) {
    return msg.isVoice === true;
  }
  function isSystemMessage(msg) {
    return typeof msg.message === "string" && msg.message.startsWith("💸");
  }

  // Load messages
  async function loadMessages() {
    if (!family) return;
    try {
      const r = await api.get(`/chat/${family.id}`);
      setMessages(r.data);
    } catch (_) {}
  }

  // Poll for new messages, but ONLY while the tab is visible and in focus.
  // Re-fetching (and re-decoding) every photo every few seconds crashes phones,
  // so we pause when the user isn't looking at the chat.
  useEffect(() => {
    if (!family) return;

    const refresh = () => {
      if (document.visibilityState === "visible" && !document.hidden) {
        loadMessages();
      }
    };

    // Load immediately, then poll every 4s only when the tab is visible.
    refresh();
    const interval = setInterval(refresh, 4000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [family]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text
  async function send(e) {
    e.preventDefault();
    const raw = text.trim();
    if (!raw || !family) return;
    let msg = raw;
    for (const [key, val] of Object.entries(SHORTCUTS)) msg = msg.split(key).join(val);

    setSending(true);
    setText("");
    try {
      await api.post(`/chat/${family.id}`, { message: msg });
      await loadMessages();
    } catch (err) {
      console.error("Send failed:", err);
      setText(raw);
      alert("Message failed to send. Is the server running?");
    } finally {
      setSending(false);
    }
  }

  function addEmoji(emoji) {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  }

    // Delete a single message (only your own)
  async function deleteOne(id) {
    if (!family || !id) return;
    try {
      await api.delete(`/chat/${family.id}/messages/${id}`);
      await loadMessages();
    } catch (_) {
      alert("You can only delete your own messages.");
    }
  }

  // Delete all messages in the family chat
  async function deleteAll() {
    if (!family) return;
    if (!window.confirm("Delete ALL messages in this chat?")) return;
    try {
      await api.delete(`/chat/${family.id}/messages`);
      await loadMessages();
    } catch (_) {}
  }

  // Downscale + compress an image to a small JPEG so it uploads quickly and
  // won't crash the phone's browser when re-rendered. We use createImageBitmap
  // (memory-efficient) when available; otherwise we fall back to <img> + canvas.
  // We NEVER send a full-resolution photo — that's what overwhelms mobile devices.
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const MAX = 1280; // longest side in px

      // Common helper: draw a bitmap/image onto a canvas and emit a small JPEG.
      const toJpeg = (source) => {
        try {
          let { width, height } = source;
          if (width > height && width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(source, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          if (source.close) source.close(); // free decoded bitmap memory
          return dataUrl;
        } catch (err) {
          if (source.close) source.close();
          throw err;
        }
      };

      // Preferred path: createImageBitmap (fast, low memory, keeps orientation).
      if (typeof createImageBitmap === "function") {
        createImageBitmap(file, { imageOrientation: "from-image" })
          .then((bitmap) => resolve(toJpeg(bitmap)))
          .catch(() => fallbackToImg());
      } else {
        fallbackToImg();
      }

      // Fallback path: classic <img> + canvas (works everywhere).
      function fallbackToImg() {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          try {
            URL.revokeObjectURL(url);
            resolve(toJpeg(img));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Cannot decode image"));
        };
        img.src = url;
      }
    });
  }

  // Handle photo/file upload (from camera or gallery)
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !family) return;
    setShowAttach(false);
    setUploadingPhoto(true);
    try {
      // Always compress — this keeps the photo small and prevents browser crashes.
      const dataUrl = await compressImage(file);
      await api.post(`/chat/${family.id}`, { message: dataUrl });
      await loadMessages();
    } catch (err) {
      console.error("Photo upload failed:", err);
      alert("Sorry, that photo couldn't be sent. Please try a different picture.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = ""; // allow re-selecting the same file next time
    }
  }

  // ---- PRESS-AND-HOLD VOICE RECORDING ----
  async function startRecording() {
    if (!family || recording) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Voice recording not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        // Calculate the recording length in whole seconds
        const durationMs = recordStartRef.current ? Date.now() - recordStartRef.current : 0;
        const durationSec = Math.round(durationMs / 1000);
        recordStartRef.current = null;
        if (blob.size > 0) {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              await api.post(`/chat/${family.id}`, {
                message: reader.result,
                isVoice: true,
                duration: durationSec,
              });
              await loadMessages();
            } catch (err) {
              console.error("Voice send failed:", err);
              alert("Voice message failed to send.");
            }
          };
          reader.readAsDataURL(blob);
        }
      };

      recordStartRef.current = Date.now(); // mark the moment recording began
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied. Please allow the microphone.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      setRecording(false);
    }
  }

  // If individual view, hide chat
  if (view === "individual") {
    return (
      <div className="page">
      <div className="page-head">
        <h2>Family Chat</h2>
        <button type="button" className="btn ghost" onClick={deleteAll} title="Delete all messages">
          🗑️ Clear chat
        </button>
      </div>
        <div className="card">
          <p className="empty">🔒 Chat is only available in <strong>Family</strong> view.</p>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) =>
    (a.createdAt || "").localeCompare(b.createdAt || "")
  );

  return (
    <div className="page">
      <div className="page-head"><h2>Family Chat</h2></div>

      <div className="messaging-layout">
        <aside className="chat-sidebar" aria-label="Conversation details">
          <div className="sidebar-head">
            <div className="sidebar-avatar">👨‍👩‍👧‍👦</div>
            <div>
              <h3>{family?.name || "Family"}</h3>
              <span className="sidebar-status">
                <i className="online-dot"></i> {family?.members?.length || 1} members
              </span>
            </div>
          </div>
          <div className="sidebar-members">
            <h4>Members</h4>
            {family?.members?.map((m) => (
              <div className="sidebar-member" key={m.id}>
                <span className="member-avatar" style={{ background: colorFor(m.user?.name) }}>
                  {m.user?.name?.[0]?.toUpperCase()}
                </span>
                <span className="member-name">{m.user?.name}</span>
                <span className="member-role">{m.role}</span>
              </div>
            ))}
          </div>
          <div className="sidebar-note">
            <p>💡 Tip: Add expenses and they'll appear here automatically.</p>
          </div>
        </aside>

        <div className="chat-card">
          <div className="chat-window" role="log" aria-live="polite" aria-label="Chat messages">
            {sortedMessages.map((m, i) => {
              const isMe = m.user?.name === user?.name;
              const isSystem = isSystemMessage(m);
              const isImage = isImageMessage(m);
              const isVoice = isVoiceMessage(m);
              const color = colorFor(m.user?.name);

              return (
                <div className={`chat-msg ${isMe ? "me" : ""} ${isSystem ? "system" : ""}`} key={m.id || i}>
                  {!isMe && !isSystem && (
                    <span className="chat-avatar" style={{ background: color }}>
                      {m.user?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="chat-bubble">
                    <div className="cb-name" style={{ color: isSystem ? "var(--success)" : color }}>
                      {isSystem ? "💰 Expense" : m.user?.name}
                    </div>
                    {isVoice ? (
                      <div className="voice-msg">
                        <audio controls src={m.message} className="chat-audio">Your browser does not support audio.</audio>
                        {m.duration > 0 && <span className="voice-duration">{m.duration}s</span>}
                      </div>
                    ) : isImage ? (
                      <img src={m.message} alt="Shared in chat" className="chat-image" loading="lazy" />
                    ) : (
                      <div>{m.message}</div>
                    )}
                      <div className="cb-time">
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                    {/* Delete this message (own messages only) */}
                    {isMe && (
                      <button
                        type="button"
                        className="chat-delete-btn"
                        onClick={() => deleteOne(m.id)}
                        aria-label="Delete message"
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {sortedMessages.length === 0 && (
              <p className="empty"></p>
            )}
            <div ref={bottomRef} />
          </div>

          {showEmoji && (
            <div className="emoji-picker" aria-label="Emoji picker">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="emoji-btn" onClick={() => addEmoji(e)}>{e}</button>
              ))}
            </div>
          )}

          <form className="chat-input" onSubmit={send}>
            <button type="button" className="chat-tool-btn" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">😀</button>

            {/* Camera / gallery button */}
            {/* capture="environment" opens the phone's rear camera directly */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFile}
            />
            {/* No capture attribute -> opens the gallery / file picker */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFile}
            />
            <button
              type="button"
              className="chat-tool-btn"
              onClick={() => setShowAttach(!showAttach)}
              title="Attach photo"
              aria-haspopup="true"
              aria-expanded={showAttach}
            >
              📷
            </button>

            {showAttach && (
              <div className="attach-menu" role="menu" aria-label="Add photo">
                <button type="button" className="attach-item" role="menuitem" onClick={() => cameraInputRef.current?.click()}>
                  📸 Take Photo
                </button>
                <button type="button" className="attach-item" role="menuitem" onClick={() => galleryInputRef.current?.click()}>
                  🖼️ Choose from Gallery
                </button>
              </div>
            )}

            {/* Press-and-hold voice button */}
            <button
              type="button"
              className={`chat-tool-btn voice-btn ${recording ? "recording" : ""}`}
              onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
              onPointerUp={() => stopRecording()}
              onPointerLeave={() => stopRecording()}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={() => stopRecording()}
              title={recording ? "Release to send" : "Hold to record"}
              aria-label="Hold to record voice"
            >
              {recording ? "⏹️" : "🎙️"}
            </button>
            {recording && <span className="recording-indicator">● Recording… release to send</span>}
            {uploadingPhoto && <span className="uploading-indicator">Sending photo…</span>}

            <label className="sr-only" htmlFor="chat-text">Message</label>
            <input id="chat-text" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} disabled={sending} />
            <button className="btn primary" type="submit" disabled={sending}>{sending ? "…" : "➤"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
