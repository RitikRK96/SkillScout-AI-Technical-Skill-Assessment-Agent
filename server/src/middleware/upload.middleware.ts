import multer from "multer";
import Busboy from "busboy";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

/**
 * Fallback file parser for Firebase Cloud Functions where multer fails
 * because the request body stream is already consumed by the framework.
 */
export function parsePDFUpload(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // If multer already populated req.file, skip
    if (req.file) {
      return next();
    }

    // Firebase Cloud Functions stores the raw body
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      // Not in Firebase environment — let it pass through (multer should have handled it)
      return next();
    }

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return next();
    }

    const busboy = Busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let fileName = "";
    let fileMime = "";

    busboy.on("file", (name: string, file: NodeJS.ReadableStream, info: { filename: string; encoding: string; mimeType: string }) => {
      if (name !== fieldName) {
        file.resume(); // skip other fields
        return;
      }
      fileName = info.filename;
      fileMime = info.mimeType;
      const chunks: Buffer[] = [];
      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", () => {
      if (fileBuffer && fileMime === "application/pdf") {
        req.file = {
          fieldname: fieldName,
          originalname: fileName,
          encoding: "7bit",
          mimetype: fileMime,
          buffer: fileBuffer,
          size: fileBuffer.length,
        } as Express.Multer.File;
      }
      next();
    });

    busboy.on("error", (err: Error) => {
      console.error("[BUSBOY ERROR]", err);
      next(err);
    });

    busboy.end(rawBody);
  };
}
