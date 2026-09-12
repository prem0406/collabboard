import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { parseCookie } from "cookie";

import jwt from "jsonwebtoken";
import prisma from "./config/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface AuthedSocket extends Socket {
  userId?: string;
}

let io: SocketIOServer;

export function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Auth happens once, at connection time — not per-event
  io.use((socket: AuthedSocket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error("No cookie provided"));

    const cookies = parseCookie(cookieHeader);
    const token = cookies.token;
    if (!token) return next(new Error("No token in cookie"));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    socket.on("board:join", async (boardId: string) => {
      // Re-check workspace membership here — a valid JWT alone doesn't
      // prove this user belongs to THIS board's workspace
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { workspaceId: true },
      });
      if (!board) return;

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: socket.userId!,
            workspaceId: board.workspaceId,
          },
        },
      });
      if (!membership) return;

      socket.join(`board:${boardId}`);
    });

    socket.on("board:leave", (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
