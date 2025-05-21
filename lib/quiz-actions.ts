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
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]))
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
    const supabase = createClient()

    // Check if Supabase is properly initialized
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

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
        correct_answers: data.correctAnswers,
      })
      .select()

    if (error) {
      console.error("Error saving quiz result to Supabase:", error)
      throw error
    }

    return { success: true, data: insertedData }
  } catch (error) {
    console.error("Error with Supabase, falling back to file storage:", error)

    // Fallback to file-based storage
    ensureDataDirectoryExists()

    // Read existing data
    const existingData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as any[]

    // Create new entry
    const newEntry = {
      id: Date.now().toString(),
      username: data.username,
      topics: data.topics,
      difficulty: data.difficulty,
      xpPoints: data.xpPoints,
      timeInSeconds: data.timeInSeconds,
      questionsCount: data.questionsCount,
      correctAnswers: data.correctAnswers,
      timestamp: Date.now(),
    }

    // Add new entry
    const updatedData = [...existingData, newEntry]

    // Write updated data
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2))

    return { success: true, data: [newEntry] }
  }
}

export async function getLeaderboard(): Promise<QuizResult[]> {
  try {
    const supabase = createClient()

    // Check if Supabase is properly initialized
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }

    // Query the leaderboard view
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("efficiency", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching leaderboard from Supabase:", error)
      throw error
    }

    // Transform the data to match the expected format
    return (data || []).map((entry) => ({
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
  } catch (error) {
    console.error("Error with Supabase, falling back to file storage:", error)

    // Fallback to file-based storage
    ensureDataDirectoryExists()

    // Read data
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as any[]

    // Calculate efficiency score (XP points / time taken)
    const entriesWithEfficiency = data.map((entry) => {
      // Avoid division by zero
      const timeInMinutes = Math.max(entry.timeInSeconds / 60, 0.1)

      // Calculate efficiency: XP per minute, adjusted by difficulty
      const difficultyMultiplier = entry.difficulty === "beginner" ? 1 : entry.difficulty === "intermediate" ? 1.5 : 2

      const efficiency = (entry.xpPoints / timeInMinutes) * difficultyMultiplier

      return {
        ...entry,
        efficiency: Number.parseFloat(efficiency.toFixed(2)),
      }
    })

    // Sort by efficiency (descending)
    const sorted = entriesWithEfficiency.sort((a, b) => b.efficiency - a.efficiency)

    // Add rank
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  }
}
