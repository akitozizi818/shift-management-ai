import {Shift} from "src/types/shift"

// lib/shiftDraftStorage.ts
const KEY = "shift-drafts"

export const loadDrafts = (): Record<string, Shift[][]> =>
  JSON.parse(localStorage.getItem(KEY) ?? "{}")

export const saveDrafts = (data: Record<string, Shift[][]>) =>
  localStorage.setItem(KEY, JSON.stringify(data))
