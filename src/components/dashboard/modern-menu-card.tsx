"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { LucideIcon } from "lucide-react"

const MotionDiv = dynamic(() => import("framer-motion").then((mod) => mod.motion.div), { ssr: false })

interface ModernMenuCardProps {
  href: string
  icon: LucideIcon
  label: string
  description: string
  color: string
}

export default function ModernMenuCard({ href, icon: Icon, label, description, color }: ModernMenuCardProps) {
  return (
    <Link href={href} className="group">
      <MotionDiv
        whileHover={{
          y: -8,
          scale: 1.02,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/30 hover:border-white/50 transition-all duration-300"
      >
        <div
          className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-full -translate-y-4 translate-x-4`}
        />

        <div className="relative z-10">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 ${color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
            {label}
          </h3>

          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </MotionDiv>
    </Link>
  )
}
