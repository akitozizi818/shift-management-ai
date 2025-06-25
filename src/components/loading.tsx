"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function FullScreenLoading() {
  const messages = [
    "AIが頭をフル回転中…",
    "シフトの可能性を探っています…",
    "もう少しで魔法のようなスケジュールが…",
    "ブラウザを閉じないでくださいね！",
    "シフトの調整をしています…",
    "お待たせしています…",
    "あなたのシフトを最適化中です…",
    "シフトの未来を描いています…",
    "AIがシフトを組み立てています…",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex flex-col items-center justify-center text-white text-center p-8">
      <motion.div
        className="text-xl sm:text-2xl font-semibold mb-6"
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        {messages[index]}
      </motion.div>

      <motion.div
        className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mb-4"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />

      <p className="text-sm sm:text-base text-red-300 mt-4">
        ※ページを更新したり閉じたりしないでください。
      </p>
    </div>
  );
}
