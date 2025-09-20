import multer from "multer";

const storage = multer.memoryStorage(); // keep file in memory
export const upload = multer({ storage });
