import { onRequest } from "firebase-functions/v2/https";
import app from "./app";

// Expose Express API as a single Cloud Function
export const api = onRequest({ region: "us-central1" }, app);
