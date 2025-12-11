import { useState } from "react";
import api from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      nav("/home")
    } catch (e) {
      alert("Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-4 border w-full max-w-xs">
        <h1 className="text-lg mb-3">Login</h1>

        <form onSubmit={submit}>
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
            Login
          </button>
        </form>

        <p className="mt-2 text-sm">
          No account? <Link to="/register" className="text-blue-600">Register</Link>
        </p>
      </div>
    </div>
  );
}
