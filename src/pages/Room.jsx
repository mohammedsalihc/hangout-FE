import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { connectSocket } from "../lib/socket";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Room() {
  const { roomId } = useParams();
  const token = localStorage.getItem("token");

  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);

  // scroll sync helpers
  const isRemoteScrollRef = useRef(false);
  const pendingFrameRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [activeProduct, setActiveProduct] = useState(null);
  const [userName, setUserName] = useState("");

  // Products (20)
  const products = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    img: `https://picsum.photos/300/200?random=${i}`,
  }));

  // INIT: fetch profile, connect socket, register handlers
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // 1) fetch profile to get user_name
        const res = await api.get("/auth/profile");
        const profile = res.data || {};
        if (!mounted) return;
        const name = profile.user_name || profile.user?.user_name || profile.userName || "";
        setUserName(name);

        // 2) connect socket with token & user_name
        const socket = connectSocket(token, name);
        socketRef.current = socket;

        // 3) join room
        socket.emit("join_room", { room_id: roomId });

        // Handlers
        socket.on("user_joined", (data) => {
          setParticipants(data.participants || []);
          const joinedName = data?.user?.name || data?.joined_user?.name;
          if (joinedName) toast.success(`${joinedName} joined`);
        });

        socket.on("user_leaved", (data) => {
          setParticipants(data.participants || []);
          const joinedName = data?.user?.name || data?.joined_user?.name;
          if (joinedName) toast.success(`${joinedName} lefted`);
        });

        socket.on("message", (data) => {
          // data could be { message: 'text' } or { message, created_at, ... }
          setMessages((s) => [...s, data]);
        });

        socket.on("user_clicked", ({ element_id }) => {
          setActiveProduct(element_id);
        });

        // SCROLL UPDATED (safe apply - prefer ratio if provided)
        socket.on("scroll_updated", ({ scrollY, ratio }) => {
          // if neither, ignore
          if (typeof scrollY !== "number" && typeof ratio !== "number") return;

          const localMax =
            Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight || 0;

          let target;
          if (typeof ratio === "number") {
            const clampedRatio = Math.max(0, Math.min(1, ratio));
            target = Math.round(clampedRatio * localMax);
          } else {
            target = Math.max(0, Math.min(scrollY || 0, localMax));
          }

          // guard to avoid re-emitting
          isRemoteScrollRef.current = true;
          // instant apply is snappy; use behavior: 'smooth' if preferred
          window.scrollTo({ top: target, behavior: "auto" });

          // clear guard after a short delay
          setTimeout(() => (isRemoteScrollRef.current = false), 200);
        });

        socket.on("page_changed", ({ page }) => {
          setPage(page);
        });
      } catch (err) {
        console.error("Failed to init room/profile:", err);
        toast.error("Failed to load profile or connect");
      }
    }

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        try {
          socketRef.current.emit("leave_room", { room_id: roomId });
        } catch (e) {}
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // auto-scroll chat when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Send chat
  function sendMessage() {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("message", { content: text, room_id: roomId });
    setText("");
  }

  // Click product
  function handleClick(id) {
    setActiveProduct(id);
    socketRef.current?.emit("click_event", { room_id: roomId, element_id: id });
  }

  // Scroll emit (rAF-throttled) sending both scrollY and ratio
  function handleScrollThrottled() {
    if (isRemoteScrollRef.current) return;
    if (pendingFrameRef.current) return;

    pendingFrameRef.current = requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      if (!socketRef.current) return;

      const scrollY = window.scrollY || 0;
      const maxScroll =
        Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight || 0;
      const ratio = maxScroll > 0 ? scrollY / maxScroll : 0;

      socketRef.current.emit("scroll_update", {
        room_id: roomId,
        scrollY,
        ratio,
      });
    });
  }

  useEffect(() => {
    window.addEventListener("scroll", handleScrollThrottled, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollThrottled);
      if (pendingFrameRef.current) cancelAnimationFrame(pendingFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Page change
  function changePage(p) {
    setPage(p);
    socketRef.current?.emit("page_change", { room_id: roomId, page: p });
  }

  // Leave room handler
  function leaveRoom() {
    if (socketRef.current) {
      try {
        socketRef.current.emit("leave_room", { room_id: roomId });
      } catch (e) {}
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    // cleanup UI and go home
    setParticipants([]);
    setMessages([]);
    window.location.href = "/home";
  }

  // Layout styles (inline — robust)
  const containerStyle = {
    display: "flex",
    gap: 16,
    padding: 16,
    height: "100vh",
    boxSizing: "border-box",
    position: "relative", // allows absolute leave button
  };

  const leftStyle = {
    width: "66.6667%",
    overflowY: "auto",
  };

  const rightStyle = {
    width: "33.3333%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 6,
    padding: 12,
    boxSizing: "border-box",
    height: "100%",
  };

  const participantsStyle = { marginBottom: 12 };

  const chatWrapperStyle = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  };

  const chatMessagesStyle = {
    flex: 1,
    overflowY: "auto",
    padding: 8,
    background: "#f7f7f8",
    borderRadius: 6,
  };

  return (
    <>
      <div style={containerStyle}>
        {/* LEFT: Products */}
        <div style={leftStyle}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              style={{
                padding: "6px 12px",
                border: "1px solid #ccc",
                background: page === 1 ? "#111" : "#fff",
                color: page === 1 ? "#fff" : "#000",
              }}
              onClick={() => changePage(1)}
            >
              Page 1
            </button>

            <button
              style={{
                padding: "6px 12px",
                border: "1px solid #ccc",
                background: page === 2 ? "#111" : "#fff",
                color: page === 2 ? "#fff" : "#000",
              }}
              onClick={() => changePage(2)}
            >
              Page 2
            </button>
          </div>

          <h2 style={{ marginBottom: 12 }}>Room: {roomId} (Page {page})</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => handleClick(p.id)}
                style={{
                  cursor: "pointer",
                  borderRadius: 6,
                  overflow: "hidden",
                  border: activeProduct === p.id ? "3px solid #2563eb" : "1px solid #ddd",
                  background: "#fff",
                }}
              >
                <img
                  src={p.img}
                  alt={`product-${p.id}`}
                  style={{ width: "100%", height: 140, objectFit: "cover" }}
                />
                <div style={{ padding: 8, fontSize: 13 }}>Product {p.id + 1}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={rightStyle}>
        <button
          onClick={leaveRoom}
          style={{
            top: 16,
            right: 16,
            padding: "6px 12px",
            background: "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            zIndex: 30,
          }}
        >
          Leave
        </button>
          <div style={participantsStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Participants</span>
              <span style={{ background: "#eee", padding: "4px 8px", borderRadius: 12 }}>
                {participants.length} online
              </span>
            </div>

            <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
              {participants.length === 0 && <div style={{ color: "#666" }}>No participants yet</div>}
              {participants.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 2px" }}>
                  <div style={{ width: 10, height: 10, background: "#16a34a", borderRadius: "50%" }}></div>
                  <div style={{ fontSize: 14 }}>{p.name}</div>
                </div>
              ))}
            </div>
          </div>
          {/* CHAT */}
          <div style={chatWrapperStyle}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Chat</div>

            <div style={chatMessagesStyle}>
              {messages.length === 0 && <div style={{ color: "#666" }}>No messages</div>}
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 8 }}>{m.message}</div>
              ))}
              <div ref={chatBottomRef}></div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                placeholder="Type message..."
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "8px 12px",
                  background: "#111",
                  color: "#fff",
                  borderRadius: 6,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}