import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  requireWorkspaceMember,
  requireRole,
} from "../middleware/workspace-access.middleware";
import * as workspaceController from "../controllers/workspace.controller";
import * as boardController from "../controllers/board.controller";
import {
  createBoardSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
} from "../schemas/board.schema";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace,
);
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
  validate(inviteMemberSchema),
  workspaceController.inviteMember,
);

router.post(
  "/:workspaceId/boards",
  requireWorkspaceMember,
  validate(createBoardSchema),
  boardController.createBoard,
);
router.get(
  "/:workspaceId/boards",
  requireWorkspaceMember,
  boardController.getBoards,
);

router.patch(
  "/:workspaceId/members/:memberId",
  requireWorkspaceMember,
  requireRole("OWNER", "ADMIN"),
  workspaceController.updateMemberRole,
);

router.delete(
  "/:workspaceId/members/:memberId",
  requireWorkspaceMember,
  requireRole("OWNER", "ADMIN"),
  workspaceController.removeMember,
);

export default router;
