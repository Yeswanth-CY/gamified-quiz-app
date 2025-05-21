"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Info } from "lucide-react"

export function ApiStatus() {
  const [status, setStatus] = useState<{
    available: boolean
    message: string
    loading: boolean
  }>({
    available: false,
    message: "Checking API connection...",
    loading: true,
  })

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("/api/check-api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ test: true }),
        })

        const data = await response.json()

        setStatus({
          available: data.available,
          message: data.message,
          loading: false,
        })
      } catch (error) {
        setStatus({
          available: false,
          message: "Unable to connect to the AI service. Using fallback questions.",
          loading: false,
        })
      }
    }

    checkApiStatus()
  }, [])

  if (status.loading) {
    return (
      <div className="p-3 bg-blue-50 rounded-lg flex items-start">
        <div className="animate-spin h-5 w-5 text-blue-500 mr-2" />
        <p className="text-sm text-blue-700">Checking AI service status...</p>
      </div>
    )
  }

  if (status.available) {
    return (
      <div className="p-3 bg-green-50 rounded-lg flex items-start">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-700">{status.message}</p>
      </div>
    )
  }

  return (
    <div className="p-3 bg-amber-50 rounded-lg flex items-start">
      <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-700">AI Service Unavailable</p>
        <p className="text-xs text-amber-600">
          {status.message} Your quiz will use our built-in question database instead.
        </p>
      </div>
    </div>
  )
}
