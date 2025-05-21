import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Try to use gemini-1.5-flash which is likely the correct name
const MODEL_NAME = "gemini-1.5-flash"

export async function POST(request: Request) {
  try {
    const { topics, difficulty, count } = await request.json()

    // First, try to list available models to help with debugging
    try {
      const models = await genAI.listModels()
      console.log(
        "Available models:",
        models.models?.map((m) => m.name),
      )
    } catch (listError) {
      console.error("Error listing models:", listError)
    }

    const prompt = `
      Generate ${count} multiple-choice quiz questions about ${topics} at a ${difficulty} level.
      
      For each question:
      1. Create a clear, concise question
      2. Provide exactly 4 options (A, B, C, D)
      3. Make sure there is exactly one correct answer
      
      Format the response as a JSON array with this structure:
      [
        {
          "id": "1",
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The correct option text"
        },
        ...
      ]
      
      Make sure the questions are appropriate for ${difficulty} level programmers.
      - Beginner: Basic concepts and syntax
      - Intermediate: More complex concepts, common patterns
      - Advanced: Complex algorithms, optimization, advanced features
      
      Only return the JSON array, nothing else.
    `

    console.log(`Using model: ${MODEL_NAME}`)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse questions from API response" }, { status: 500 })
    }

    const jsonStr = jsonMatch[0]
    const questions = JSON.parse(jsonStr)

    return NextResponse.json(questions)
  } catch (error) {
    console.error(`Error with model ${MODEL_NAME}:`, error)

    // If we can't use the API, generate some hardcoded questions as a fallback
    const topics = "python,java,sql,javascript" // Example topics
    const difficulty = "beginner" // Example difficulty
    const count = 3 // Example count
    const fallbackQuestions = generateFallbackQuestions(topics, difficulty, count)

    // Log the error but return fallback questions
    console.log("Using fallback questions due to API error")
    return NextResponse.json(fallbackQuestions)
  }
}

// Fallback function to generate questions without the API
function generateFallbackQuestions(topics: string, difficulty: string, count: number) {
  const topicsList = topics.split(",").map((t) => t.trim().toLowerCase())

  // Basic set of questions for common programming topics
  const questionsByTopic: Record<string, any[]> = {
    python: [
      {
        id: "1",
        question: "What is the correct way to create a function in Python?",
        options: ["function myFunc():", "def myFunc():", "create myFunc():", "func myFunc():"],
        correctAnswer: "def myFunc():",
      },
      {
        id: "2",
        question: "Which of the following is used to comment a single line in Python?",
        options: ["/* comment */", "// comment", "# comment", "<!-- comment -->"],
        correctAnswer: "# comment",
      },
      {
        id: "3",
        question: "What does the len() function do in Python?",
        options: [
          "Returns the largest item in an iterable",
          "Returns the length of an object",
          "Returns the lowest item in an iterable",
          "Returns the sum of all items in an iterable",
        ],
        correctAnswer: "Returns the length of an object",
      },
    ],
    java: [
      {
        id: "1",
        question: "Which keyword is used to define a class in Java?",
        options: ["class", "struct", "object", "define"],
        correctAnswer: "class",
      },
      {
        id: "2",
        question: "What is the entry point of a Java program?",
        options: ["start()", "run()", "main()", "execute()"],
        correctAnswer: "main()",
      },
      {
        id: "3",
        question: "Which of the following is not a primitive data type in Java?",
        options: ["int", "boolean", "String", "char"],
        correctAnswer: "String",
      },
    ],
    sql: [
      {
        id: "1",
        question: "Which SQL statement is used to extract data from a database?",
        options: ["EXTRACT", "GET", "SELECT", "OPEN"],
        correctAnswer: "SELECT",
      },
      {
        id: "2",
        question: "Which SQL clause is used to filter records?",
        options: ["WHERE", "FILTER", "HAVING", "CONDITION"],
        correctAnswer: "WHERE",
      },
      {
        id: "3",
        question: "Which SQL statement is used to update data in a database?",
        options: ["SAVE", "MODIFY", "UPDATE", "CHANGE"],
        correctAnswer: "UPDATE",
      },
    ],
    javascript: [
      {
        id: "1",
        question: "Which function is used to parse a string to an integer in JavaScript?",
        options: ["Integer.parse()", "parseInteger()", "parseInt()", "toInt()"],
        correctAnswer: "parseInt()",
      },
      {
        id: "2",
        question: "What will '2' + 2 evaluate to in JavaScript?",
        options: ["4", "22", "TypeError", "NaN"],
        correctAnswer: "22",
      },
      {
        id: "3",
        question: "Which method is used to add elements to the end of an array in JavaScript?",
        options: ["push()", "append()", "add()", "insert()"],
        correctAnswer: "push()",
      },
    ],
    general: [
      {
        id: "1",
        question: "What does CPU stand for?",
        options: [
          "Central Processing Unit",
          "Computer Personal Unit",
          "Central Process Unit",
          "Central Processor Unit",
        ],
        correctAnswer: "Central Processing Unit",
      },
      {
        id: "2",
        question: "Which data structure operates on a Last-In-First-Out (LIFO) principle?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        correctAnswer: "Stack",
      },
      {
        id: "3",
        question: "What is the time complexity of a binary search algorithm?",
        options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"],
        correctAnswer: "O(log n)",
      },
    ],
  }

  // Select questions based on the topics provided
  let selectedQuestions: any[] = []

  // First try to find questions for the specific topics
  for (const topic of topicsList) {
    if (questionsByTopic[topic]) {
      selectedQuestions = [...selectedQuestions, ...questionsByTopic[topic]]
    }
  }

  // If we don't have enough questions, add some general ones
  if (selectedQuestions.length < count) {
    selectedQuestions = [...selectedQuestions, ...questionsByTopic.general]
  }

  // Limit to the requested count and assign new IDs
  return selectedQuestions.slice(0, count).map((q, index) => ({
    ...q,
    id: (index + 1).toString(),
  }))
}
