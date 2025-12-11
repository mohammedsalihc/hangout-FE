import { io } from "socket.io-client";

export const connectSocket = (token, user_name) => {
  return io("http://localhost:8080", {
    path: "/socket",
    query: { token, user_name },
  });
};

  