import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Use the provided API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || ""

export async function POST(request: Request) {
  try {
    // If no API key is available, return unavailable status
    if (!API_KEY) {
      return NextResponse.json({
        available: false,
        message: "API key is not configured.",
      })
    }

    // Initialize the API client
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Try a simple prompt to test the API
    const result = await model.generateContent("Respond with 'OK' if you can read this.")
    const text = result.response.text()

    // Check if we got a valid response
    if (text && text.includes("OK")) {
      return NextResponse.json({
        available: true,
        message: "AI service is available and working correctly.",
      })
    } else {
      return NextResponse.json({
        available: false,
        message: "AI service responded but with unexpected content.",
      })
    }
  } catch (error) {
    console.error("Error checking API status:", error)

    let errorMessage = "Unknown error occurred while connecting to the AI service."

    if (error instanceof Error) {
      // Extract a more specific error message if possible
      if (error.message.includes("403")) {
        errorMessage = "API key authentication failed (403 Forbidden)."
      } else if (error.message.includes("429")) {
        errorMessage = "API rate limit exceeded (429 Too Many Requests)."
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection to AI service timed out."
      } else {
        errorMessage = `Error: ${error.message}`
      }
    }

    return NextResponse.json({
      available: false,
      message: errorMessage,
    })
  }
}
