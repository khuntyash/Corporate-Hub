import { demoStorage } from "./demo-storage";
import type { IStorage } from "./storage";

// Use demo storage if DATABASE_URL is not set or in demo mode
const useDemoStorage = !process.env.DATABASE_URL || process.env.NODE_ENV === "demo";

// In demo mode, export demoStorage directly without touching db/storage modules
let exportedStorage: IStorage;

if (useDemoStorage) {
  exportedStorage = demoStorage;
} else {
  const { storage } = await import("./storage.js");
  exportedStorage = storage;
}

export const storage = exportedStorage;
