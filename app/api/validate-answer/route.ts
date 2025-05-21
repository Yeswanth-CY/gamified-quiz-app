import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Use the provided API key
const API_KEY = "AIzaSyB1vp1qK2Jr_-erD4iqVEa6gd9M2zK1AG8"
const genAI = new GoogleGenerativeAI(API_KEY)

// Use gemini-1.5-flash as requested
const MODEL_NAME = "gemini-1.5-flash"

export async function POST(request: Request) {
  try {
    const { question, userAnswer, difficulty } = await request.json()

    // Check if this is a fallback question with a known correctAnswer
    if (question.correctAnswer) {
      const isCorrect = userAnswer === question.correctAnswer
      return NextResponse.json({
        isCorrect,
        feedback: isCorrect
          ? "Correct! Your answer matches our solution."
          : `Incorrect. The correct answer is: ${question.correctAnswer}`,
      })
    }

    const prompt = `
      Evaluate if the following answer is correct for the given question.
      
      Question: ${question.question || question}
      User's answer: ${userAnswer}
      Difficulty level: ${difficulty}
      
      First, determine if the answer is correct or incorrect.
      Then, provide brief feedback explaining why the answer is correct or incorrect.
      
      Format your response as a JSON object:
      {
        "isCorrect": true/false,
        "feedback": "Your feedback here"
      }
      
      Only return the JSON object, nothing else.
    `

    console.log(`Attempting to use model: ${MODEL_NAME}`)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    // Log model details to help diagnose issues
    console.log("Model configuration:", {
      modelName: MODEL_NAME,
      apiKey: API_KEY ? "API key provided" : "No API key provided",
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    console.log("API Response received, length:", text.length)
    console.log("First 100 chars of response:", text.substring(0, 100))

    // Extract JSON from the response
    const jsonMatch = text.match(/\{.*\}/s)
    if (!jsonMatch) {
      console.error("Failed to parse validation from API response. Full response:", text)
      return NextResponse.json({ error: "Failed to parse validation from API response" }, { status: 500 })
    }

    const jsonStr = jsonMatch[0]

    try {
      const validation = JSON.parse(jsonStr)
      console.log(`Successfully validated answer using model: ${MODEL_NAME}`)
      return NextResponse.json(validation)
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "JSON string:", jsonStr)
      throw new Error("Failed to parse JSON response")
    }
  } catch (error) {
    console.error(`Error with model ${MODEL_NAME}:`, error)

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // If the API fails, do a simple string comparison to determine if the answer is correct
    try {
      const { question, userAnswer } = await request.json()

      // If we have the correct answer directly in the question object
      if (question.correctAnswer) {
        const isCorrect = userAnswer === question.correctAnswer
        return NextResponse.json({
          isCorrect,
          feedback: isCorrect
            ? "Correct! Your answer matches our solution."
            : `Incorrect. The correct answer is: ${question.correctAnswer}`,
        })
      }

      // Simple fallback validation - just assume it's correct
      return NextResponse.json({
        isCorrect: true,
        feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
      })
    } catch (fallbackError) {
      // If even our fallback fails, just give the user the benefit of the doubt
      return NextResponse.json({
        isCorrect: true,
        feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
      })
    }
  }
}
