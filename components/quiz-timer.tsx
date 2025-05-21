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

  return (
    <motion.div
      animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5 }}
      className={`flex items-center ${
        minutes >= 5
          ? "bg-red-100 text-red-800"
          : minutes >= 3
            ? "bg-amber-100 text-amber-800"
            : "bg-purple-100 text-purple-800"
      } px-3 py-1 rounded-full text-sm font-medium`}
    >
      <Clock className="h-4 w-4 mr-1" />
      {String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
    </motion.div>
  )
}
