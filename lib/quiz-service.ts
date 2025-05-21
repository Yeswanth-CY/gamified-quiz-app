export async function generateQuestions(topics: string, difficulty: string, count: number) {
  try {
    const response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topics, difficulty, count }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate questions")
    }

    return await response.json()
  } catch (error) {
    console.error("Error generating questions:", error)
    throw new Error("Failed to generate questions")
  }
}

export async function validateAnswer(question: string, userAnswer: string, difficulty: string) {
  try {
    const response = await fetch("/api/validate-answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, userAnswer, difficulty }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to validate answer")
    }

    return await response.json()
  } catch (error) {
    console.error("Error validating answer:", error)
    throw new Error("Failed to validate answer")
  }
}
