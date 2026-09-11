import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});
