import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase client not initialized",
          message: "Check your Supabase environment variables",
          usingFileStorage: true,
        },
        { status: 500 },
      )
    }

    // Check if the quiz_results table exists by trying to query it
    const { data, error: checkError } = await supabase.from("quiz_results").select("id").limit(1)

    // If the table doesn't exist, we'll get an error
    if (checkError) {
      console.error("Error checking if quiz_results table exists:", checkError)
      return NextResponse.json(
        {
          error: checkError.message,
          message: "Error accessing quiz_results table. Check your Supabase setup.",
          usingFileStorage: true,
        },
        { status: 500 },
      )
    }

    // Check if the leaderboard view exists
    const { data: leaderboardData, error: leaderboardError } = await supabase.from("leaderboard").select("id").limit(1)

    if (leaderboardError && !leaderboardError.message.includes("does not exist")) {
      console.error("Error checking leaderboard view:", leaderboardError)
    }

    // If we get here, the table exists
    console.log("Database setup verified successfully")
    return NextResponse.json({
      success: true,
      message: "Database setup complete",
      usingFileStorage: false,
      tablesFound: ["quiz_results"],
      viewsFound: leaderboardError ? [] : ["leaderboard"],
    })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json(
      {
        error: "Failed to set up database",
        message: "Check your Supabase connection",
        usingFileStorage: true,
      },
      { status: 500 },
    )
  }
}
