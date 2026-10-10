import type { StudioData } from "./types";
import { createSeed } from "./seed";
const KEY = "frameflow.studio.v1";
// Replace this repository with an API adapter without changing the UI.
export const studioRepository = {
  load(): StudioData {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const arrays = [
          "bookings",
          "clients",
          "projects",
          "deliverables",
          "requests",
          "blocks",
          "payments",
          "milestones",
          "activities",
          "notifications",
          "team",
        ];
        if (
          arrays.every((key) => Array.isArray(parsed[key])) &&
          parsed.settings?.name &&
          parsed.team.length
        )
          return parsed;
      }
    } catch {
      /* Use a clean seed if storage is unavailable or corrupted. */
    }
    return createSeed();
  },
  save(data: StudioData): boolean {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },
};
