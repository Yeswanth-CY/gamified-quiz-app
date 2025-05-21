import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getLeaderboard } from "@/lib/quiz-actions"
import { Trophy, Clock, Award, ArrowLeft, AlertTriangle } from "lucide-react"

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-purple-100">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">Leaderboard</h1>
            <p className="text-purple-600">See who's leading the pack!</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              New Quiz
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
        <Card className="w-full shadow-lg border-purple-200">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-purple-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-purple-800 mb-2">No entries yet</h2>
              <p className="text-purple-600 mb-6">Be the first to complete a quiz and claim the top spot!</p>
              <Link href="/">
                <Button className="bg-purple-700 hover:bg-purple-800">Take a Quiz</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-purple-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-purple-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">Player</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">Topics</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">Difficulty</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">XP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-purple-800">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-purple-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        {entry.rank <= 3 ? (
                          <Award
                            className={`h-5 w-5 mr-1 ${
                              entry.rank === 1
                                ? "text-yellow-500"
                                : entry.rank === 2
                                  ? "text-gray-400"
                                  : "text-amber-700"
                            }`}
                          />
                        ) : (
                          <span className="w-5 inline-block text-center">{entry.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.username}</td>
                    <td className="px-4 py-3 text-sm">
                      {Array.isArray(entry.topics) ? entry.topics.join(", ") : entry.topics}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{entry.difficulty}</td>
                    <td className="px-4 py-3 text-sm">{entry.xpPoints}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-purple-500" />
                        {Math.floor(entry.timeInSeconds / 60)}m {entry.timeInSeconds % 60}s
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-purple-800">
                      {typeof entry.efficiency === "number" ? entry.efficiency.toFixed(2) : entry.efficiency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
              We encountered an error while loading the leaderboard. Please try again later.
            </p>
            <Link href="/">
              <Button className="bg-purple-700 hover:bg-purple-800">Return to Quiz</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function LeaderboardSkeleton() {
  return (
    <Card className="w-full shadow-lg border-purple-200">
      <CardHeader className="bg-purple-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
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
