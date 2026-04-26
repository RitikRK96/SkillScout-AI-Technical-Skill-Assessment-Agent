import { Response } from "express";

export function initSSE(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

export function sendChunk(res: Response, chunk: string) {
  res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`);
}

export function sendEvent(res: Response, event: string, data: object = {}) {
  res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
}

export function closeSSE(res: Response) {
  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  res.end();
}
