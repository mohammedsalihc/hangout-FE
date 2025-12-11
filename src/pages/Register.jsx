import { useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [user_name, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/auth/register", { user_name, email, password });
      alert("Registered. Login now.");
      nav("/login");
    } catch (e) {
      alert("Register failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-4 border w-full max-w-xs">
        <h1 className="text-lg mb-3">Register</h1>

        <form onSubmit={submit}>
          <input
            className="border w-full p-2 mb-2"
            placeholder="Name"
            value={user_name}
            onChange={(e) => setUserName(e.target.value)}
          />

          <input
            className="border w-full p-2 mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border w-full p-2 mb-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="bg-black text-white w-full p-2">
            Register
          </button>
        </form>

        <p className="mt-2 text-sm">
          Have account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
