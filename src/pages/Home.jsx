import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();
  function logout() {
    localStorage.removeItem("token");
    nav("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="border p-4 w-full max-w-xs text-center">
        <h1 className="text-lg mb-3">Welcome</h1>

        <Link to="/create">
          <button className="w-full bg-black text-white p-2 mb-2">
            Create Room
          </button>
        </Link>

        <Link to="/join">
          <button className="w-full bg-black text-white p-2">
            Join Room
          </button>
        </Link>

        <button
          onClick={logout}
          className="w-full p-2 mt-4 border text-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
