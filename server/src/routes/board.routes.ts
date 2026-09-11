import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireBoardAccess } from "../middleware/workspace-access.middleware";
import * as boardController from "../controllers/board.controller";
import * as listController from "../controllers/list.controller";

const router = Router();

router.use(requireAuth);

router.get("/:boardId", requireBoardAccess, boardController.getBoard);
router.delete("/:boardId", requireBoardAccess, boardController.deleteBoard);
router.post("/:boardId/lists", requireBoardAccess, listController.createList);

export default router;
