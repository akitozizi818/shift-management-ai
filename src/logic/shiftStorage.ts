import { Shift } from "src/types/shift"

const KEY = "shift-map"                      

export const loadShiftMap = (): Record<string, Shift[]> => {
  if (typeof window === "undefined") return {}          // SSR ガード
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {                                             
    localStorage.removeItem(KEY)
    return {}
  }
}

export const saveShiftMap = (map: Record<string, Shift[]>) => {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(map))
}
