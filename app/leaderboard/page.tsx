import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getLeaderboard } from "@/lib/quiz-actions"
import { Trophy, Clock, Award, AlertTriangle, Database, Gamepad2, Medal, Crown } from "lucide-react"

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-indigo-700 flex items-center">
              <Trophy className="h-8 w-8 mr-2 text-amber-500" />
              Leaderboard
            </h1>
            <p className="text-purple-600">See who's leading the pack!</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 border-purple-200 text-purple-700">
              <Gamepad2 className="h-4 w-4" />
              New Quest
            </Button>
          </Link>
        </div>

        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardContent />
        </Suspense>
      </div>
    </main>
  )
}

async function LeaderboardContent() {
  try {
    const leaderboard = await getLeaderboard()

    if (leaderboard.length === 0) {
      return (
        <Card className="w-full shadow-lg border-purple-200 overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-purple-800 mb-2">No entries yet</h2>
              <p className="text-purple-600 mb-6">Be the first to complete a quiz and claim the top spot!</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Take a Quiz
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-start">
          <Database className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-700">Using Database Storage</p>
            <p className="text-xs text-green-600">Scores are being saved to your Supabase database.</p>
          </div>
        </div>

        <Card className="w-full shadow-lg border-purple-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-amber-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Player</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Topics</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Difficulty</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">XP</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.id} className={`border-b hover:bg-amber-50 ${index < 3 ? "bg-amber-50/50" : ""}`}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          {entry.rank <= 3 ? (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                entry.rank === 1 ? "bg-yellow-100" : entry.rank === 2 ? "bg-gray-100" : "bg-amber-100"
                              }`}
                            >
                              <Medal
                                className={`h-5 w-5 ${
                                  entry.rank === 1
                                    ? "text-yellow-500"
                                    : entry.rank === 2
                                      ? "text-gray-400"
                                      : "text-amber-700"
                                }`}
                              />
                            </div>
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-medium">
                              {entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {entry.rank <= 3 ? <span className="font-bold">{entry.username}</span> : entry.username}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(entry.topics) ? (
                            entry.topics.map((topic, i) => (
                              <span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                {topic}
                              </span>
                            ))
                          ) : (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              {entry.topics}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            entry.difficulty === "beginner"
                              ? "bg-green-100 text-green-800"
                              : entry.difficulty === "intermediate"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-purple-500" />
                          {entry.xpPoints}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-blue-500" />
                          {Math.floor(entry.timeInSeconds / 60)}m {entry.timeInSeconds % 60}s
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs inline-block">
                          {typeof entry.efficiency === "number" ? entry.efficiency.toFixed(2) : entry.efficiency}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </>
    )
  } catch (error) {
    console.error("Error rendering leaderboard:", error)
    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-amber-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Leaderboard Error
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-amber-800 mb-2">Unable to load leaderboard</h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading the leaderboard. This might be due to a database issue.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Return to Quest
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function LeaderboardSkeleton() {
  return (
    <Card className="w-full shadow-lg border-purple-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
