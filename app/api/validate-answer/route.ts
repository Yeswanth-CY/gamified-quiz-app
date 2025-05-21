import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Try to use gemini-1.5-flash which is likely the correct name
const MODEL_NAME = "gemini-1.5-flash"

export async function POST(request: Request) {
  try {
    const { question, userAnswer, difficulty } = await request.json()

    const prompt = `
      Evaluate if the following answer is correct for the given question.
      
      Question: ${question}
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

    console.log(`Using model: ${MODEL_NAME}`)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\{.*\}/s)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse validation from API response" }, { status: 500 })
    }

    const jsonStr = jsonMatch[0]
    const validation = JSON.parse(jsonStr)

    return NextResponse.json(validation)
  } catch (error) {
    console.error(`Error with model ${MODEL_NAME}:`, error)

    // If the API fails, do a simple string comparison to determine if the answer is correct
    // This is a very basic fallback and won't work well for complex questions
    try {
      const { question, userAnswer } = await request.json()

      // Simple fallback validation - just check if the strings match exactly
      // In a real app, you'd want a more sophisticated approach
      const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase()

      return NextResponse.json({
        isCorrect,
        feedback: isCorrect
          ? "Your answer appears to be correct."
          : "Your answer appears to be incorrect. Please check your response.",
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
