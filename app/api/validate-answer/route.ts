import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Use the provided API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

// Use gemini-1.5-flash as requested
const MODEL_NAME = "gemini-1.5-flash"

export async function POST(request: Request) {
  try {
    const { question, userAnswer, difficulty } = await request.json()

    // Check if this is a fallback question with a known correctAnswer
    if (question.correctAnswer || question.fromFallback) {
      const isCorrect = userAnswer === question.correctAnswer
      return NextResponse.json({
        isCorrect,
        feedback: isCorrect
          ? "Correct! Your answer matches our solution."
          : `Incorrect. The correct answer is: ${question.correctAnswer}`,
      })
    }

    // Check if API key is available
    if (!API_KEY) {
      console.error("Gemini API key is missing. Using simple validation.")
      // Simple fallback validation - just assume it's correct
      return NextResponse.json({
        isCorrect: true,
        feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
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

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      console.log("API Response received, length:", text.length)
      console.log("First 100 chars of response:", text.substring(0, 100))

      // Extract JSON from the response
      const jsonMatch = text.match(/\{.*\}/s)
      if (!jsonMatch) {
        console.error("Failed to parse validation from API response. Full response:", text)
        return NextResponse.json({
          isCorrect: true,
          feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
        })
      }

      const jsonStr = jsonMatch[0]

      try {
        const validation = JSON.parse(jsonStr)
        console.log(`Successfully validated answer using model: ${MODEL_NAME}`)
        return NextResponse.json(validation)
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "JSON string:", jsonStr)
        return NextResponse.json({
          isCorrect: true,
          feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
        })
      }
    } catch (modelError) {
      console.error(`Error with model ${MODEL_NAME}:`, modelError)
      return NextResponse.json({
        isCorrect: true,
        feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
      })
    }
  } catch (error) {
    console.error(`General error:`, error)

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // Simple fallback validation - just assume it's correct
    return NextResponse.json({
      isCorrect: true,
      feedback: "We couldn't validate your answer due to technical issues, but we'll count it as correct.",
    })
  }
}
