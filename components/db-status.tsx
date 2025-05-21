"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

export function DbStatus() {
  const [status, setStatus] = useState<{
    success: boolean
    message: string
    loading: boolean
  }>({
    success: false,
    message: "Checking database connection...",
    loading: true,
  })

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch("/api/setup-db")
        const data = await response.json()

        setStatus({
          success: response.ok && !data.error,
          message: data.message || (response.ok ? "Database connected" : "Database connection issue"),
          loading: false,
        })
      } catch (error) {
        setStatus({
          success: false,
          message: "Failed to check database status",
          loading: false,
        })
      }
    }

    checkDbStatus()
  }, [])

  if (status.loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 bg-blue-50 rounded-lg flex items-start"
      >
        <div className="animate-spin h-5 w-5 text-blue-500 mr-2" />
        <p className="text-sm text-blue-700">Checking database connection...</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-3 ${status.success ? "bg-green-50" : "bg-amber-50"} rounded-lg flex items-start`}
    >
      {status.success ? (
        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
      )}
      <p className={`text-sm ${status.success ? "text-green-700" : "text-amber-700"}`}>{status.message}</p>
    </motion.div>
  )
}
