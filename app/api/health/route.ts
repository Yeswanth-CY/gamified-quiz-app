import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Use the provided API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || ""

export async function GET() {
  try {
    // Return environment status (without revealing the actual key)
    const envStatus = {
      geminiApiKeyAvailable: !!API_KEY,
      geminiApiKeyLength: API_KEY ? API_KEY.length : 0,
      nodeEnv: process.env.NODE_ENV,
    }

    // If no API key is available, return status without testing
    if (!API_KEY) {
      return NextResponse.json({
        status: "error",
        message: "API key is not configured",
        environment: envStatus,
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
        status: "healthy",
        message: "Gemini API is working correctly",
        environment: envStatus,
      })
    } else {
      return NextResponse.json({
        status: "warning",
        message: "Gemini API responded but with unexpected content",
        response: text.substring(0, 100),
        environment: envStatus,
      })
    }
  } catch (error) {
    console.error("Health check error:", error)

    let errorMessage = "Unknown error occurred while connecting to the Gemini API"

    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`
    }

    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
        environment: {
          geminiApiKeyAvailable: !!API_KEY,
          geminiApiKeyLength: API_KEY ? API_KEY.length : 0,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 },
    )
  }
}
