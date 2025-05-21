"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"

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

  // Update the ref when seconds change
  useEffect(() => {
    secondsRef.current = seconds
    // Only call onTimeUpdate from an effect, not during render
    onTimeUpdate(seconds)
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
    <div className="flex items-center bg-purple-100 px-3 py-1 rounded-full text-purple-800 text-sm font-medium">
      <Clock className="h-4 w-4 mr-1" />
      {String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
    </div>
  )
}
