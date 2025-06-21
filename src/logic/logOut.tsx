// logic/logout.ts
export const logout = (push: (url: string) => void) => {
  /* 例: localStorage.clear() など */
  push("/")  // ルートへ
}
