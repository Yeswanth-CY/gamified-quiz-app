import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const API_KEY = process.env.GEMINI_API_KEY || ""

    if (!API_KEY) {
      return NextResponse.json({
        valid: false,
        message: "API key is not configured",
        details: "No API key found in environment variables",
      })
    }

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Try a simple prompt to test the API
    const result = await model.generateContent("Respond with 'OK' if you can read this.")
    const text = result.response.text()

    return NextResponse.json({
      valid: true,
      message: "API key is valid",
      response: text.substring(0, 100),
    })
  } catch (error) {
    let errorMessage = "Unknown error"
    let errorDetails = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    }

    // Check for specific error types
    const errorString = errorMessage.toString()
    const isExpiredKey = errorString.includes("API key expired") || errorString.includes("API_KEY_INVALID")

    return NextResponse.json({
      valid: false,
      message: isExpiredKey ? "API key has expired" : "API key validation failed",
      details: errorMessage,
      isExpired: isExpiredKey,
    })
  }
}
