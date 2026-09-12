import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("token");
    const socketUrl = process.env.NEXT_PUBLIC_API_URL!.replace("/api", "");
    socket = io(socketUrl, { withCredentials: true, autoConnect: false });
  }
  return socket;
}
