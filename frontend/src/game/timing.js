import { ENGINE_TUNING } from "./tuning";

export function gradeTimingDistance(distance) {
  if (!Number.isFinite(distance) || distance < 0) return "late";
  if (distance <= ENGINE_TUNING.perfectTimingDistance) return "perfect";
  if (distance <= ENGINE_TUNING.goodTimingDistance) return "good";
  if (distance <= ENGINE_TUNING.lateTimingDistance) return "early";
  return "late";
}
