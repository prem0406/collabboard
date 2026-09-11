import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireListAccess } from "../middleware/workspace-access.middleware";
import * as listController from "../controllers/list.controller";
import * as cardController from "../controllers/card.controller";

const router = Router();

router.use(requireAuth);

router.delete("/:listId", requireListAccess, listController.deleteList);
router.post("/:listId/cards", requireListAccess, cardController.createCard);

export default router;
