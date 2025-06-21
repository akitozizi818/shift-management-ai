// logic/shiftDraftStorage.ts
import type { Shift } from "@/types/shift";

export type DraftMap = Record<string, Record<string, Shift[]>[]>;

export function saveDrafts(map: DraftMap): void {
  localStorage.setItem("shiftDrafts", JSON.stringify(map));
}

export function loadDrafts(): DraftMap {
  const raw = localStorage.getItem("shiftDrafts");
  return raw ? JSON.parse(raw) as DraftMap : {};
}
