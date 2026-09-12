import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireListAccess } from "../middleware/workspace-access.middleware";
import * as listController from "../controllers/list.controller";
import * as cardController from "../controllers/card.controller";
import { createCardSchema } from "../schemas/board.schema";
import { validate } from "../middleware/validate.middleware";

const router = Router();

router.use(requireAuth);

router.delete("/:listId", requireListAccess, listController.deleteList);
router.post(
  "/:listId/cards",
  requireListAccess,
  validate(createCardSchema),
  cardController.createCard,
);

export default router;
