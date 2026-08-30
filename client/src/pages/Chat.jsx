// =====================================================================
// Chat page — messaging with sidebar, emoji, gallery pictures and voice
// Uses REST for reliable sending + display.
// =====================================================================
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Copy, EllipsisVertical, Mic, Plus, Square, Trash2 } from "lucide-react";
import { useFamily } from "../context/FamilyContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const EMOJIS = [
  "😀", "😂", "😍", "😎", "🤔", "👍", "👏", "🎉", "❤️", "😢",
  "😡", "🤗", "🙏", "💪", "😴", "🤯", "🥳", "😇", "🙌", "👌",
  "🛒", "💸", "💰", "🏠", "🍕", "☕", "🚗", "🎁", "💡", "⚠️",
];

const SHORTCUTS = { ":)": "😀", ":(": "😢", ":D": "😁", "<3": "❤️", ":P": "😛" };
const MAX_VOICE_SECONDS = 55;

// Convert a browser-specific recording into mono 16 kHz PCM WAV. This is
// intentionally compact and plays inline across modern Android, iOS and
// desktop browsers without asking the recipient to download the recording.
async function createInlineVoiceBlob(recordedBlob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const OfflineContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContextClass || !OfflineContextClass) return recordedBlob;

  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await recordedBlob.arrayBuffer());
    const sampleRate = 16000;
    const frameCount = Math.max(1, Math.ceil(decoded.duration * sampleRate));
    const offline = new OfflineContextClass(1, frameCount, sampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);
    const wav = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(wav);
    const write = (offset, value) => {
      for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
    };

    write(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, samples.length * 2, true);
    for (let index = 0; index < samples.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, samples[index]));
      view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Blob([wav], { type: "audio/wav" });
  } finally {
    await context.close().catch(() => {});
  }
}

export default function Chat() {
  const { family, view, familyLoading, refreshFamilies } = useFamily();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const galleryInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordStartRef = useRef(null);
  const recordingLimitRef = useRef(null);
  const bottomRef = useRef(null);
  const chatWindowRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

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
    return msg.isVoice === true
      || (typeof msg.message === "string" && /^data:(?:audio\/(?:webm|mp4|ogg|mpeg|wav|x-m4a)|video\/(?:webm|mp4)|application\/ogg)[;,]/i.test(msg.message));
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
      const nextMessages = Array.isArray(r.data) ? r.data : [];
      const windowElement = chatWindowRef.current;
      const wasNearBottom = !windowElement
        || windowElement.scrollHeight - windowElement.scrollTop - windowElement.clientHeight < 120;

      setMessages((currentMessages) => {
        const signature = (items) => items.map((item) =>
          `${item.id}:${item.updatedAt || item.createdAt}:${item.deletedAt || ""}:${item.message?.length || 0}`
        ).join("|");
        if (signature(currentMessages) === signature(nextMessages)) return currentMessages;
        shouldAutoScrollRef.current = shouldAutoScrollRef.current || wasNearBottom || currentMessages.length === 0;
        return nextMessages;
      });
    } catch (_) {}
  }

  // Load on family change + poll every 3s so new messages always show
  useEffect(() => {
    if (!family) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [family]);

  useEffect(() => {
    function closeMenus() {
      setConversationMenuOpen(false);
      setMessageMenuId(null);
    }
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  // Keep the reader's chosen scroll position. Move to the latest message only
  // on first load, after sending, or when the reader was already near the end.
  useLayoutEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    shouldAutoScrollRef.current = false;
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
      shouldAutoScrollRef.current = true;
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
      setNotice("You can only delete your own messages.");
    }
  }

  // Delete all messages in the family chat
  async function deleteAll() {
    if (!family) return;
    setConfirmClearOpen(false);
    try {
      await api.delete(`/chat/${family.id}/messages`);
      await loadMessages();
      setNotice("Chat cleared.");
    } catch (err) {
      setNotice(err.response?.data?.message || "The chat could not be cleared. Try again.");
    }
  }

  function messageCopyText(message) {
    if (isImageMessage(message)) return "[Photo]";
    if (isVoiceMessage(message)) return "[Voice message]";
    return message.message || "";
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(successMessage);
    } catch (_) {
      setNotice("Copying is not available in this browser.");
    }
  }

  function copyMessage(message) {
    return copyText(messageCopyText(message), "Message copied.");
  }

  function copyConversation(items) {
    const value = items
      .map((message) => `${message.user?.name || "Family member"}: ${messageCopyText(message)}`)
      .join("\n");
    if (!value) {
      setNotice("There are no messages to copy.");
      return;
    }
    return copyText(value, "Conversation copied.");
  }

  // Resize camera photos before sending. Phone photos are often too large for
  // an API request, while a 1024px JPEG remains clear inside the chat.
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (file.type && !supportedTypes.includes(file.type.toLowerCase())) {
        reject(new Error("This gallery format is not supported. Choose a JPEG, PNG, WebP or GIF picture."));
        return;
      }
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
    if (file.size > 15 * 1024 * 1024) {
      setNotice("This picture is too large. Choose an image smaller than 15 MB.");
      e.target.value = "";
      return;
    }
    setUploadingPhoto(true);
    setNotice("");
    try {
      const image = await compressImage(file);
      await api.post(`/chat/${family.id}`, { message: image });
      shouldAutoScrollRef.current = true;
      await loadMessages();
    } catch (err) {
      console.error("Photo send failed:", err);
      setNotice(err.response?.data?.message || err.message || "The picture could not be sent. Please try another picture.");
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
        if (recordingLimitRef.current) clearTimeout(recordingLimitRef.current);
        recordingLimitRef.current = null;
        const durationMs = recordStartRef.current ? Date.now() - recordStartRef.current : 0;
        const durationSec = Math.round(durationMs / 1000);
        // Some mobile browsers report an audio-only recording as video/webm
        // or video/mp4. Normalize the Blob MIME type so every family member's
        // browser renders the saved data URL with an audio player.
        const recordedType = recorder.mimeType || "audio/webm";
        const audioType = recordedType.includes("mp4")
          ? "audio/mp4"
          : recordedType.includes("ogg")
            ? "audio/ogg"
            : "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: audioType });
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
              shouldAutoScrollRef.current = true;
              await loadMessages();
              setNotice("Voice message sent.");
            } catch (err) {
              console.error("Voice send failed:", err);
              setNotice(err.response?.data?.message || "The voice message could not be sent. Please try again.");
            }
          };
          try {
            const inlineBlob = await createInlineVoiceBlob(blob);
            reader.readAsDataURL(inlineBlob);
          } catch (error) {
            console.error("Voice conversion failed:", error);
            reader.readAsDataURL(blob);
          }
        }
      };

      recorder.start();
      recordingLimitRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setRecording(false);
          setNotice("Maximum recording length reached. Sending voice message…");
        }
      }, MAX_VOICE_SECONDS * 1000);
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
      if (recordingLimitRef.current) clearTimeout(recordingLimitRef.current);
      recordingLimitRef.current = null;
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
          <h2>{t("familyChat", "Family Chat")}</h2>
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
        <div className="page-head"><h1>{t("familyChat", "Family Chat")}</h1></div>
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
        <h2>{t("familyChat", "Family Chat")}</h2>
        <div className="chat-menu-wrap">
          <button
            type="button"
            className="chat-overflow-btn"
            aria-label="Conversation options"
            aria-expanded={conversationMenuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMessageMenuId(null);
              setConversationMenuOpen((open) => !open);
            }}
          >
            <EllipsisVertical size={20} aria-hidden="true" />
          </button>
          {conversationMenuOpen && (
            <div className="chat-action-menu conversation-menu" role="menu" onClick={(event) => event.stopPropagation()}>
              <button type="button" role="menuitem" onClick={() => { copyConversation(conversationMessages); setConversationMenuOpen(false); }}>
                <Copy size={16} aria-hidden="true" /> {t("copyAll", "Copy all messages")}
              </button>
              <button type="button" role="menuitem" className="danger" onClick={() => { setConversationMenuOpen(false); setConfirmClearOpen(true); }}>
                <Trash2 size={16} aria-hidden="true" /> {t("clearChat", "Clear chat")}
              </button>
            </div>
          )}
        </div>
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
            <h4>{t("members", "Members")}</h4>
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
            <h4>{t("sharedExpenses", "Shared expenses")}</h4>
            {sharedExpenses.length > 0 ? sharedExpenses.map((expense) => (
              <div className="shared-expense" key={expense.id}>
                <span>{expense.message.replace(/^💸\s*/, "")}</span>
                <small>{expense.createdAt ? new Date(expense.createdAt).toLocaleDateString(locale) : ""}</small>
              </div>
            )) : (
              <p>Expenses appear here only when “Share in family chat” is selected.</p>
            )}
          </div>
        </aside>

        <div className="chat-card">
          <div ref={chatWindowRef} className="chat-window" role="log" aria-live="polite" aria-label="Chat messages">
            {conversationMessages.map((m, i) => {
              const isMe = m.user?.id === user?.id || m.user?.name === user?.name;
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
                    <div className="cb-meta">
                      <span className="cb-time">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                      {isMe && (
                        <span className="chat-delivered" aria-label={t("delivered", "Delivered")} title={t("delivered", "Delivered")}>
                          <CheckCheck size={14} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="chat-message-menu-wrap">
                      <button
                        type="button"
                        className="chat-message-menu-btn"
                        aria-label="Message options"
                        aria-expanded={messageMenuId === m.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setConversationMenuOpen(false);
                          setMessageMenuId((id) => id === m.id ? null : m.id);
                        }}
                      >
                        <EllipsisVertical size={16} aria-hidden="true" />
                      </button>
                      {messageMenuId === m.id && (
                        <div className="chat-action-menu message-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                          <button type="button" role="menuitem" onClick={() => { copyMessage(m); setMessageMenuId(null); }}>
                            <Copy size={15} aria-hidden="true" /> {t("copyMessage", "Copy message")}
                          </button>
                          {isMe && (
                            <button type="button" role="menuitem" className="danger" onClick={() => { setMessageMenuId(null); deleteOne(m.id); }}>
                              <Trash2 size={15} aria-hidden="true" /> {t("deleteMessage", "Delete message")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleFile}
            />
            <button
              type="button"
              className="chat-tool-btn"
              onClick={() => galleryInputRef.current?.click()}
              title="Choose a picture from gallery"
              aria-label="Choose a picture from gallery"
            >
              <Plus size={21} aria-hidden="true" />
            </button>

            {/* One click starts recording; the next click stops and sends it. */}
            <button
              type="button"
              className={`chat-tool-btn voice-btn ${recording ? "recording" : ""}`}
              onClick={toggleRecording}
              title={recording ? "Stop and send recording" : "Start voice recording"}
              aria-label={recording ? "Stop and send voice recording" : "Start voice recording"}
            >
              {recording
                ? <Square size={17} fill="currentColor" aria-hidden="true" />
                : <Mic size={20} aria-hidden="true" />}
            </button>
            {recording && <span className="recording-indicator">● Recording…</span>}
            {uploadingPhoto && <span className="recording-indicator">Sending picture…</span>}

            <label className="sr-only" htmlFor="chat-text">Message</label>
            <input id="chat-text" placeholder={t("typeMessage", "Type a message…")} value={text} onChange={(e) => setText(e.target.value)} disabled={sending} />
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

      {confirmClearOpen && (
        <div
          className="modal-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmClearOpen(false);
          }}
        >
          <div className="modal-card chat-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-chat-title">
            <div>
              <h2 id="clear-chat-title">Clear this chat?</h2>
              <p>This permanently removes all messages for every family member.</p>
            </div>
            <div className="drawer-actions">
              <button className="btn ghost" type="button" onClick={() => setConfirmClearOpen(false)}>Cancel</button>
              <button className="btn danger" type="button" onClick={deleteAll}>Clear chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
