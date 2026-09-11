import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./socket";
import authRoutes from "./routes/auth.routes";
import workspaceRoutes from "./routes/workspace.routes";
import boardRoutes from "./routes/board.routes";
import listRoutes from "./routes/list.routes";
import cardRoutes from "./routes/card.routes";
import path from "path";
import attachmentRoutes from "./routes/attachment.routes";
import commentRoutes from "./routes/comment.routes";

dotenv.config();

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "CollabBoard API is running" });
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/cards", commentRoutes);
app.use("/api/cards", attachmentRoutes);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
