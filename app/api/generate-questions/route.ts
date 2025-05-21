import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Use the provided API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(API_KEY)

// Use gemini-1.5-flash as requested
const MODEL_NAME = "gemini-1.5-flash"

export async function POST(request: Request) {
  try {
    const { topics, difficulty, count } = await request.json()

    // Check if API key is available
    if (!API_KEY) {
      console.error("Gemini API key is missing. Using fallback questions.")
      const fallbackQuestions = generateFallbackQuestions(topics, difficulty, count)
      return NextResponse.json(fallbackQuestions)
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

    console.log(`Attempting to use model: ${MODEL_NAME} with API key: ${API_KEY ? "Available" : "Not available"}`)

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME })

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      console.log("API Response received, length:", text.length)
      console.log("First 100 chars of response:", text.substring(0, 100))

      // Extract JSON from the response
      const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s)
      if (!jsonMatch) {
        console.error("Failed to parse questions from API response. Full response:", text)
        return NextResponse.json(generateFallbackQuestions(topics, difficulty, count))
      }

      const jsonStr = jsonMatch[0]

      try {
        const questions = JSON.parse(jsonStr)
        console.log(`Successfully generated ${questions.length} questions using model: ${MODEL_NAME}`)

        // Add a flag to indicate these are from the API
        const questionsWithSource = questions.map((q) => ({
          ...q,
          fromAPI: true,
        }))

        return NextResponse.json(questionsWithSource)
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "JSON string:", jsonStr)
        return NextResponse.json(generateFallbackQuestions(topics, difficulty, count))
      }
    } catch (modelError) {
      console.error(`Error with model ${MODEL_NAME}:`, modelError)
      return NextResponse.json(generateFallbackQuestions(topics, difficulty, count))
    }
  } catch (error) {
    console.error(`General error:`, error)

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    try {
      const { topics, difficulty, count } = await request.json()
      const fallbackQuestions = generateFallbackQuestions(topics, difficulty, count)
      return NextResponse.json(fallbackQuestions)
    } catch (fallbackError) {
      // If we can't even parse the request, return some generic questions
      return NextResponse.json(generateFallbackQuestions("programming", "beginner", 5))
    }
  }
}

// Enhanced fallback function to generate questions without the API
function generateFallbackQuestions(topics: string, difficulty: string, count: number) {
  console.log(`Using fallback questions for topics: ${topics}, difficulty: ${difficulty}, count: ${count}`)

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
      {
        id: "4",
        question: "How do you create a list in Python?",
        options: ["list = (1, 2, 3)", "list = [1, 2, 3]", "list = {1, 2, 3}", "list = <1, 2, 3>"],
        correctAnswer: "list = [1, 2, 3]",
      },
      {
        id: "5",
        question: "Which method is used to add an element at the end of a list in Python?",
        options: ["list.add()", "list.append()", "list.insert()", "list.extend()"],
        correctAnswer: "list.append()",
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
      {
        id: "4",
        question: "How do you declare a constant variable in Java?",
        options: ["const int x = 10;", "final int x = 10;", "static int x = 10;", "constant int x = 10;"],
        correctAnswer: "final int x = 10;",
      },
      {
        id: "5",
        question: "Which keyword is used for inheritance in Java?",
        options: ["extends", "implements", "inherits", "using"],
        correctAnswer: "extends",
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
      {
        id: "4",
        question: "How do you declare a variable in modern JavaScript?",
        options: ["var x = 5;", "let x = 5;", "const x = 5;", "Both B and C are correct"],
        correctAnswer: "Both B and C are correct",
      },
      {
        id: "5",
        question: "Which of the following is not a JavaScript framework or library?",
        options: ["React", "Angular", "Django", "Vue"],
        correctAnswer: "Django",
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
      {
        id: "4",
        question: "Which SQL statement is used to delete data from a database?",
        options: ["REMOVE", "DELETE", "CLEAR", "DROP"],
        correctAnswer: "DELETE",
      },
      {
        id: "5",
        question: "Which SQL statement is used to create a new table?",
        options: ["CREATE TABLE", "NEW TABLE", "ADD TABLE", "INSERT TABLE"],
        correctAnswer: "CREATE TABLE",
      },
    ],
    html: [
      {
        id: "1",
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Hyper Transfer Markup Language",
          "Hyper Text Modern Links",
        ],
        correctAnswer: "Hyper Text Markup Language",
      },
      {
        id: "2",
        question: "Which tag is used to create a hyperlink in HTML?",
        options: ["<link>", "<a>", "<href>", "<url>"],
        correctAnswer: "<a>",
      },
      {
        id: "3",
        question: "Which HTML element is used to define an unordered list?",
        options: ["<ol>", "<list>", "<ul>", "<dl>"],
        correctAnswer: "<ul>",
      },
      {
        id: "4",
        question: "Which attribute is used to specify the URL of the linked resource?",
        options: ["src", "link", "href", "url"],
        correctAnswer: "href",
      },
      {
        id: "5",
        question: "Which HTML tag is used to define a table?",
        options: ["<table>", "<tab>", "<tbl>", "<grid>"],
        correctAnswer: "<table>",
      },
    ],
    css: [
      {
        id: "1",
        question: "What does CSS stand for?",
        options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
        correctAnswer: "Cascading Style Sheets",
      },
      {
        id: "2",
        question: "Which property is used to change the background color?",
        options: ["color", "bgcolor", "background-color", "background"],
        correctAnswer: "background-color",
      },
      {
        id: "3",
        question: "How do you select an element with id 'demo'?",
        options: [".demo", "#demo", "demo", "*demo"],
        correctAnswer: "#demo",
      },
      {
        id: "4",
        question: "Which CSS property controls the text size?",
        options: ["text-size", "font-style", "font-size", "text-style"],
        correctAnswer: "font-size",
      },
      {
        id: "5",
        question: "How do you make text bold in CSS?",
        options: ["font-weight: bold;", "style: bold;", "text-style: bold;", "font: bold;"],
        correctAnswer: "font-weight: bold;",
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
      {
        id: "4",
        question: "Which of the following is not a programming paradigm?",
        options: [
          "Object-Oriented Programming",
          "Functional Programming",
          "Procedural Programming",
          "Sequential Programming",
        ],
        correctAnswer: "Sequential Programming",
      },
      {
        id: "5",
        question: "What is the purpose of version control systems like Git?",
        options: [
          "To compile code faster",
          "To track changes in source code over time",
          "To automatically fix bugs in code",
          "To optimize code execution",
        ],
        correctAnswer: "To track changes in source code over time",
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
    fromFallback: true, // Add a flag to indicate these are fallback questions
  }))
}
