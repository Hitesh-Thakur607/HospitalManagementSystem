import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { chatAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./ChatPanel.module.css";

const getSocketBaseUrl = () => {
  const rawApiBase = process.env.REACT_APP_API_URL?.trim();

  if (!rawApiBase || rawApiBase === "/") {
    return window.location.origin;
  }

  return rawApiBase.replace(/\/api\/?$/, "").replace(/\/+$/, "");
};

const ChatPanel = ({ currentUser, peerUserId, peerName, peerRole, peerStatus, showToast }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const bottomRef = useRef(null);

  const peerLabel = useMemo(() => peerName || "Conversation", [peerName]);
  const currentUserId = Number(currentUser?.id);

  const isMessageMine = (message) => {
    if (typeof message?.is_mine === "boolean") {
      return message.is_mine;
    }

    return Number(message?.sender_user_id) === currentUserId;
  };

  const appendMessages = (incomingMessages) => {
    setMessages((previous) => {
      const nextMessages = [...previous];

      incomingMessages.forEach((message) => {
        if (!messageIdsRef.current.has(message.id)) {
          messageIdsRef.current.add(message.id);
          nextMessages.push(message);
        }
      });

      return nextMessages;
    });
  };

  useEffect(() => {
    if (!peerUserId) {
      setMessages([]);
      setDraft("");
      setError("");
      setConnectionState("idle");
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError("");
    messageIdsRef.current = new Set();

    chatAPI
      .getMessages(peerUserId)
      .then((data) => {
        if (!active) return;

        setMessages(Array.isArray(data) ? data : []);
        (Array.isArray(data) ? data : []).forEach((message) => messageIdsRef.current.add(message.id));
      })
      .catch((fetchError) => {
        if (!active) return;
        const message = getErrorMessage(fetchError);
        setError(message);
        showToast?.(message, "error");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnectionState("connected"));
    socket.on("disconnect", () => setConnectionState("offline"));
    socket.on("connect_error", (socketError) => {
      setConnectionState("offline");
      setError(socketError.message || "Unable to connect to chat");
    });

    socket.on("chat:new", (message) => {
      appendMessages([message]);
    });

    socket.emit("chat:join", { peerUserId }, (acknowledgement) => {
      if (!acknowledgement?.ok) {
        setError(acknowledgement?.message || "Unable to open conversation");
      }
    });

    return () => {
      active = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.id, currentUser?.role, peerUserId, showToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = draft.trim();
    if (!trimmedMessage || !peerUserId) {
      return;
    }

    const socket = socketRef.current;
    setError("");

    if (socket?.connected) {
      socket.emit("chat:message", { peerUserId, message: trimmedMessage }, (acknowledgement) => {
        if (!acknowledgement?.ok) {
          const message = acknowledgement?.message || "Message failed to send";
          setError(message);
          showToast?.(message, "error");
          return;
        }

        setDraft("");
      });
      return;
    }

    try {
      const sentMessage = await chatAPI.sendMessage(peerUserId, trimmedMessage);
      appendMessages([sentMessage]);
      setDraft("");
    } catch (sendError) {
      const message = getErrorMessage(sendError);
      setError(message);
      showToast?.(message, "error");
    }
  };

  const threadReady = Boolean(peerUserId);

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Secure live chat</p>
          <h3>{peerLabel}</h3>
          <p className={styles.subtle}>{peerRole ? `${peerRole} conversation` : "Select a person to start talking"}</p>
        </div>
        <div className={styles.statusWrap}>
          {peerStatus ? <span className={styles.statusBadge}>{peerStatus}</span> : null}
          <span className={`${styles.connectionBadge} ${styles[connectionState]}`}>{connectionState}</span>
        </div>
      </div>

      {!threadReady ? (
        <div className={styles.emptyState}>
          Pick a doctor or patient to open the conversation.
        </div>
      ) : (
        <>
          <div className={styles.messages}>
            {loading ? <div className={styles.systemNote}>Loading conversation...</div> : null}
            {!loading && messages.length === 0 ? <div className={styles.systemNote}>No messages yet. Start with a simple hello.</div> : null}

            {messages.map((message) => {
              const isMine = isMessageMine(message);

              return (
                <article key={message.id} className={`${styles.messageRow} ${isMine ? styles.mine : styles.theirs}`}>
                  <div className={styles.messageBubble}>
                    <div className={styles.messageMeta}>
                      <span>{isMine ? "You" : message.sender_name || "Member"}</span>
                      <time>{message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</time>
                    </div>
                    <p>{message.message}</p>
                  </div>
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <form className={styles.composer} onSubmit={handleSendMessage}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message..."
              rows={3}
              disabled={!threadReady}
            />
            <div className={styles.composerFooter}>
              <span>{peerStatus === "approved" ? "Approved doctor ready" : "Messages are stored and synced in real time"}</span>
              <button type="submit" disabled={!draft.trim() || !threadReady}>
                Send Message
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
};

export default ChatPanel;