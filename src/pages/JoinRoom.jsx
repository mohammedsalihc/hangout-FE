import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [code, setCode] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/rooms/join", { code });
      nav(`/room/${res.data.room?.code}`);
    } catch (e) {
      alert("Invalid code");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border p-4 w-full max-w-xs">
        <h1 className="text-lg mb-3">Join Room</h1>

        <form onSubmit={submit}>
          <input
            className="border w-full p-2 mb-2"
            placeholder="Room Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="bg-black text-white w-full p-2">
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
