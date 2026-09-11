import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import * as boardController from "../controllers/board.controller";
import * as listController from "../controllers/list.controller";

const router = Router();

router.use(requireAuth);

// Note: no requireWorkspaceMember here yet — see explanation below
router.get("/:boardId", boardController.getBoard);
router.delete("/:boardId", boardController.deleteBoard);
router.post("/:boardId/lists", listController.createList);

export default router;
