"use client"

import type React from "react"

import { forwardRef } from "react"
import styles from "./card.module.css"

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`${styles.card} ${className || ""}`} {...props} />
))
Card.displayName = "Card"

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`${styles.cardHeader} ${className || ""}`} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={`${styles.cardTitle} ${className || ""}`} {...props} />,
)
CardTitle.displayName = "CardTitle"

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`${styles.cardContent} ${className || ""}`} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
