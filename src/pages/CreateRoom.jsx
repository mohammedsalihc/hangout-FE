import { useState } from "react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function CreateRoom() {
  const [name, setName] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/rooms/room", {
        name,
        activity_type: "shopping",
      });
      console.log(res)
      const roomCode = res.data.code;
      nav(`/room/${roomCode}`);
    } catch (e) {
        console.log(e)
      alert("Room creation failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border p-4 w-full max-w-xs">
        <h1 className="text-lg mb-3">Create Room</h1>

        <form onSubmit={submit}>
          <input
            className="border w-full p-2 mb-2"
            placeholder="Room Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button className="bg-black text-white w-full p-2">
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
