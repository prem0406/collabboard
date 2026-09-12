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
import { errorHandler } from "./middleware/error-handler.middleware";
import { apiLimiter } from "./middleware/rate-limit.middleware";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import logger from "./config/logger";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "CollabBoard API is running" });
});
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/cards", commentRoutes);
app.use("/api/cards", attachmentRoutes);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
