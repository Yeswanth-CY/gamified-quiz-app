"use server"

import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

type QuizResult = {
  id: string
  username: string
  topics: string[]
  difficulty: string
  xpPoints: number
  timeInSeconds: number
  questionsCount: number
  correctAnswers: number
  efficiency: number
  created_at: string
  rank: number
}

const DATA_FILE = path.join(process.cwd(), "data", "leaderboard.json")

function ensureDataDirectoryExists() {
  try {
    const dataDir = path.join(process.cwd(), "data")
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]))
    }
  } catch (error) {
    console.error("Error ensuring data directory exists:", error)
    // Create the file in the current directory as a fallback
    if (!fs.existsSync("leaderboard.json")) {
      fs.writeFileSync("leaderboard.json", JSON.stringify([]))
    }
  }
}

export async function saveQuizResult(data: {
  username: string
  topics: string[]
  difficulty: string
  xpPoints: number
  timeInSeconds: number
  questionsCount: number
  correctAnswers: number
}) {
  try {
    console.log("Saving quiz result to Supabase:", {
      username: data.username,
      topics: data.topics,
      difficulty: data.difficulty,
      xp_points: data.xpPoints,
      time_in_seconds: data.timeInSeconds,
      questions_count: data.questionsCount,
      correct_answers: data.correctAnswers,
    })

    const supabase = createClient()

    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error("Supabase client not initialized")
      throw new Error("Supabase client not initialized")
    }

    // Ensure correctAnswers is an integer
    const correctAnswers = Math.round(data.correctAnswers)

    // Insert the quiz result into the database
    const { data: insertedData, error } = await supabase
      .from("quiz_results")
      .insert({
        username: data.username,
        topics: data.topics,
        difficulty: data.difficulty,
        xp_points: data.xpPoints,
        time_in_seconds: data.timeInSeconds,
        questions_count: data.questionsCount,
        correct_answers: correctAnswers,
      })
      .select()

    if (error) {
      console.error("Error saving quiz result to Supabase:", error)
      throw error
    }

    console.log("Successfully saved quiz result to Supabase:", insertedData)
    return { success: true, data: insertedData }
  } catch (error) {
    console.error("Error saving quiz result:", error)
    throw error
  }
}

export async function getLeaderboard(): Promise<QuizResult[]> {
  try {
    console.log("Fetching leaderboard from Supabase")
    const supabase = createClient()

    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error("Supabase client not initialized")
      throw new Error("Supabase client not initialized")
    }

    // Try to query the leaderboard view first
    try {
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("leaderboard")
        .select("*")
        .order("rank", { ascending: true })
        .limit(50)

      if (leaderboardError) {
        console.error("Error fetching from leaderboard view:", leaderboardError)
        throw leaderboardError
      }

      if (leaderboardData && leaderboardData.length > 0) {
        console.log("Successfully fetched leaderboard from view:", leaderboardData.length, "entries")
        // Transform the data to match the expected format
        return leaderboardData.map((entry) => ({
          id: entry.id,
          username: entry.username,
          topics: entry.topics,
          difficulty: entry.difficulty,
          xpPoints: entry.xp_points,
          timeInSeconds: entry.time_in_seconds,
          questionsCount: entry.questions_count,
          correctAnswers: entry.correct_answers,
          efficiency: entry.efficiency,
          created_at: entry.created_at,
          rank: entry.rank,
        }))
      }
    } catch (viewError) {
      console.log("Error querying leaderboard view, falling back to direct query:", viewError)
      // Continue to query the quiz_results table directly
    }

    // If the leaderboard view doesn't exist or is empty, query the quiz_results table directly
    const { data: resultsData, error: resultsError } = await supabase
      .from("quiz_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (resultsError) {
      console.error("Error fetching from quiz_results table:", resultsError)
      throw resultsError
    }

    console.log("Successfully fetched quiz results:", resultsData?.length || 0, "entries")

    // Transform the data to match the expected format
    return (resultsData || []).map((entry, index) => {
      // Calculate efficiency score (XP points / time taken)
      const timeInMinutes = Math.max(entry.time_in_seconds / 60, 0.1)
      const difficultyMultiplier = entry.difficulty === "beginner" ? 1 : entry.difficulty === "intermediate" ? 1.5 : 2
      const efficiency = (entry.xp_points / timeInMinutes) * difficultyMultiplier

      return {
        id: entry.id,
        username: entry.username,
        topics: entry.topics,
        difficulty: entry.difficulty,
        xpPoints: entry.xp_points,
        timeInSeconds: entry.time_in_seconds,
        questionsCount: entry.questions_count,
        correctAnswers: entry.correct_answers,
        efficiency: Number.parseFloat(efficiency.toFixed(2)),
        created_at: entry.created_at,
        rank: index + 1,
      }
    })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    throw error
  }
}

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
