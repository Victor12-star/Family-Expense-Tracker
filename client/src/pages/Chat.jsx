// =====================================================================
// Chat page — messaging with sidebar, emoji, camera, press-hold voice
// Uses REST for reliable sending + display.
// =====================================================================
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
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
  const { family, view, familyLoading, refreshFamilies } = useFamily();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState("");
  const [lightbox, setLightbox] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordStartRef = useRef(null);
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
    if (typeof msg.message !== "string") return false;
    return msg.message.startsWith("💸") || /\badded an expense:\s/i.test(msg.message);
  }

  // Load messages
  async function loadMessages() {
    if (!family) return;
    try {
      const r = await api.get(`/chat/${family.id}`);
      setMessages(r.data);
    } catch (_) {}
  }

  // Load on family change + poll every 3s so new messages always show
  useEffect(() => {
    if (!family) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [family]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text
  async function send(e) {
    e.preventDefault();
    const raw = text.trim();
    if (!raw) return;
    if (!family) {
      setNotice("Create or join a family before sending a family message.");
      return;
    }
    let msg = raw;
    for (const [key, val] of Object.entries(SHORTCUTS)) msg = msg.split(key).join(val);

    setSending(true);
    setNotice("");
    setText("");
    try {
      await api.post(`/chat/${family.id}`, { message: msg });
      await loadMessages();
    } catch (err) {
      console.error("Send failed:", err);
      setText(raw);
      setNotice(err.response?.data?.message || "Message could not be sent. Check the connection and try again.");
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

  // Resize camera photos before sending. Phone photos are often too large for
  // an API request, while a 1024px JPEG remains clear inside the chat.
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        try {
          const maxSide = 1024;
          let { width, height } = image;
          const scale = Math.min(1, maxSide / Math.max(width, height));
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Image processing is unavailable");
          context.drawImage(image, 0, 0, width, height);
          const result = canvas.toDataURL("image/jpeg", 0.72);
          URL.revokeObjectURL(objectUrl);
          if (!result || result.length < 500) throw new Error("The picture could not be read");
          resolve(result);
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("This picture format could not be read"));
      };
      image.src = objectUrl;
    });
  }

  // Send a picture selected from the camera or gallery.
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !family) return;
    setShowAttach(false);
    setUploadingPhoto(true);
    setNotice("");
    try {
      const image = await compressImage(file);
      await api.post(`/chat/${family.id}`, { message: image });
      await loadMessages();
    } catch (err) {
      console.error("Photo send failed:", err);
      setNotice(err.response?.data?.message || "The picture could not be sent. Please try another picture.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  // ---- CLICK-TO-START / CLICK-TO-SEND VOICE RECORDING ----
  async function startRecording() {
    if (recording) return;
    if (!family) {
      setNotice("Create or join a family before recording a family message.");
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Voice recording not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const durationMs = recordStartRef.current ? Date.now() - recordStartRef.current : 0;
        const durationSec = Math.round(durationMs / 1000);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
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
              setNotice("Voice message sent.");
            } catch (err) {
              console.error("Voice send failed:", err);
              setNotice(err.response?.data?.message || "The voice message could not be sent. Please try again.");
            }
          };
          reader.readAsDataURL(blob);
        }
      };

      recorder.start();
      setRecording(true);
      setNotice("Recording started. Click the microphone again to send.");
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
      setNotice("Sending voice message…");
    }
  }

  function toggleRecording() {
    if (recording) stopRecording();
    else startRecording();
  }

  // Chat belongs only to the shared family workspace. Single mode must never
  // expose family messages or member information.
  if (view === "single") {
    return (
      <div className="page chat-page">
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

  if (familyLoading) {
    return (
      <div className="page chat-page">
        <div className="card empty-state">
          <h2>Loading family chat…</h2>
          <p>Please wait while your family workspace is checked.</p>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="page chat-page">
        <div className="page-head"><h1>Family Chat</h1></div>
        <div className="card empty-state chat-setup-state">
          <div className="empty-icon">💬</div>
          <h2>Connect a family before messaging</h2>
          <p>Family Chat needs a real family workspace so messages remain private between its members.</p>
          <div className="empty-actions">
            <Link className="btn primary" to="/family">Create or join a family</Link>
            <button className="btn secondary" type="button" onClick={() => refreshFamilies()}>
              Check again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) =>
    (a.createdAt || "").localeCompare(b.createdAt || "")
  );
  const sharedExpenses = sortedMessages.filter(isSystemMessage).slice(-5).reverse();
  const conversationMessages = sortedMessages.filter((message) => !isSystemMessage(message));

  return (
    <div className="page chat-page">
      <div className="page-head">
        <h2>Family Chat</h2>
        <button type="button" className="btn ghost" onClick={deleteAll} title="Delete all messages">
          🗑️ Clear chat
        </button>
      </div>

      <div className="messaging-layout">
        <aside className="chat-sidebar" aria-label="Conversation details">
          <div className="sidebar-head">
            <div className="sidebar-avatar"></div>
            <div>
              <h3>{family.name}</h3>
              <span className="sidebar-status">
                <i className="online-dot"></i> {family.members?.length || 0} members
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
          <div className="sidebar-note shared-expenses">
            <h4>Shared expenses</h4>
            {sharedExpenses.length > 0 ? sharedExpenses.map((expense) => (
              <div className="shared-expense" key={expense.id}>
                <span>{expense.message.replace(/^💸\s*/, "")}</span>
                <small>{expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : ""}</small>
              </div>
            )) : (
              <p>Expenses appear here only when “Share in family chat” is selected.</p>
            )}
          </div>
        </aside>

        <div className="chat-card">
          <div className="chat-window" role="log" aria-live="polite" aria-label="Chat messages">
            {conversationMessages.map((m, i) => {
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
                        <audio controls preload="metadata" src={m.message} className="chat-audio">
                          Your browser does not support voice messages.
                        </audio>
                        {m.duration > 0 && <span className="voice-duration">{m.duration}s</span>}
                      </div>
                    ) : isImage ? (
                      <button type="button" className="chat-image-btn" onClick={() => setLightbox(m.message)}>
                        <img src={m.message} alt="Shared in chat" className="chat-image" loading="lazy" />
                      </button>
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
            {conversationMessages.length === 0 && (
              <p className="empty">No messages yet. Say hi to your family! 👋</p>
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

          {notice && <div className="chat-notice" role="status">{notice}</div>}

          <form className="chat-input" onSubmit={send}>
            <button type="button" className="chat-tool-btn" onClick={() => setShowEmoji(!showEmoji)} title="Emoji">😀</button>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <button type="button" className="chat-tool-btn" onClick={() => setShowAttach((open) => !open)} title="Add picture">📷</button>
            {showAttach && (
              <div className="attach-menu" role="menu" aria-label="Add a picture">
                <button type="button" onClick={() => cameraInputRef.current?.click()}>📸 Take picture</button>
                <button type="button" onClick={() => galleryInputRef.current?.click()}>🖼️ Choose picture</button>
              </div>
            )}

            {/* One click starts recording; the next click stops and sends it. */}
            <button
              type="button"
              className={`chat-tool-btn voice-btn ${recording ? "recording" : ""}`}
              onClick={toggleRecording}
              title={recording ? "Stop and send recording" : "Start voice recording"}
              aria-label={recording ? "Stop and send voice recording" : "Start voice recording"}
            >
              {recording ? "⏹️" : "🎙️"}
            </button>
            {recording && <span className="recording-indicator">● Recording…</span>}
            {uploadingPhoto && <span className="recording-indicator">Sending picture…</span>}

            <label className="sr-only" htmlFor="chat-text">Message</label>
            <input id="chat-text" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} disabled={sending} />
            <button className="btn primary" type="submit" disabled={sending}>{sending ? "…" : "➤"}</button>
          </form>
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Picture preview" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Shared picture enlarged" className="lightbox-img" />
          <button type="button" className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close picture">×</button>
        </div>
      )}
    </div>
  );
}
