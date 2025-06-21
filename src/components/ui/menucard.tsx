import Link from "next/link";
import dynamic from "next/dynamic";


const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);
export default function MenuCard({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="group">
      <MotionDiv
        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-6 border hover:border-blue-500"
      >
        <Icon className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{label}</span>
      </MotionDiv>
    </Link>
  );
}