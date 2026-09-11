import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  requireWorkspaceMember,
  requireRole,
} from "../middleware/workspace-access.middleware";
import * as workspaceController from "../controllers/workspace.controller";
import * as boardController from "../controllers/board.controller";

const router = Router();

router.use(requireAuth);

router.post("/", workspaceController.createWorkspace);
router.get("/", workspaceController.getMyWorkspaces);

router.get(
  "/:workspaceId",
  requireWorkspaceMember,
  workspaceController.getWorkspace,
);
router.post(
  "/:workspaceId/members",
  requireWorkspaceMember,
  requireRole("OWNER", "ADMIN"),
  workspaceController.inviteMember,
);

router.post(
  "/:workspaceId/boards",
  requireWorkspaceMember,
  boardController.createBoard,
);
router.get(
  "/:workspaceId/boards",
  requireWorkspaceMember,
  boardController.getBoards,
);

export default router;
