import {Shift} from "src/types/shift"

const KEY = "shift-requests";
const isBrowser = typeof window !== "undefined";

export const loadRequestMap = (): Record<string, Shift[]> => {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  }
  return {}; // サーバーサイドでは空のオブジェクトを返す
};

export const saveRequestMap = (m: Record<string, Shift[]>) => {
  if (isBrowser) {
    localStorage.setItem(KEY, JSON.stringify(m));
  }
};
