// hooks/useShiftRequest.ts
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/logic/firebase";
import { ShiftRequest } from "@/types/shift";

export const useShiftRequest = (userId: string, month: string) => {
  const [data, setData] = useState<ShiftRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !month) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ref = collection(db, "shiftRequests");
        const q = query(ref, where("userId", "==", userId), where("month", "==", month));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setData(doc.data() as ShiftRequest);
        } else {
          setData(null);
        }
      } catch (err: any) {
        setError(err.message || "取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, month]);

  return { data, loading, error };
};
