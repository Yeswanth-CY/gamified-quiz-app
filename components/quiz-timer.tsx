"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { motion } from "framer-motion"

export function QuizTimer({
  isRunning,
  onTimeUpdate,
}: {
  isRunning: boolean
  onTimeUpdate: (seconds: number) => void
}) {
  const [seconds, setSeconds] = useState(0)
  // Use a ref to track seconds to avoid calling onTimeUpdate during render
  const secondsRef = useRef(seconds)
  const [isWarning, setIsWarning] = useState(false)
  const [isPulse, setIsPulse] = useState(false)

  // Update the ref when seconds change
  useEffect(() => {
    secondsRef.current = seconds
    // Only call onTimeUpdate from an effect, not during render
    onTimeUpdate(seconds)

    // Add warning animation when time reaches certain thresholds
    if (seconds > 0 && seconds % 60 === 0) {
      setIsWarning(true)
      setTimeout(() => setIsWarning(false), 1000)
    }

    // Add pulse animation every 10 seconds
    if (seconds > 0 && seconds % 10 === 0) {
      setIsPulse(true)
      setTimeout(() => setIsPulse(false), 1000)
    }
  }, [seconds, onTimeUpdate])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  // Determine color based on time
  const getTimerColor = () => {
    if (minutes >= 5) {
      return {
        bg: "bg-gradient-to-r from-red-100 to-red-200",
        text: "text-red-800",
        border: "border-red-300",
        icon: "text-red-600",
      }
    } else if (minutes >= 3) {
      return {
        bg: "bg-gradient-to-r from-amber-100 to-amber-200",
        text: "text-amber-800",
        border: "border-amber-300",
        icon: "text-amber-600",
      }
    } else {
      return {
        bg: "bg-gradient-to-r from-purple-100 to-purple-200",
        text: "text-purple-800",
        border: "border-purple-300",
        icon: "text-purple-600",
      }
    }
  }

  const timerColor = getTimerColor()

  return (
    <motion.div
      animate={isWarning ? { scale: [1, 1.1, 1] } : isPulse ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5 }}
      className={`flex items-center ${timerColor.bg} px-4 py-2 rounded-full ${timerColor.text} text-sm font-medium shadow-sm border ${timerColor.border}`}
      whileHover={{ scale: 1.05 }}
    >
      <Clock className={`h-4 w-4 mr-2 ${timerColor.icon}`} />
      <span className="font-mono tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
      </span>
    </motion.div>
  )
}
