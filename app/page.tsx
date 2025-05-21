import QuizSetup from "@/components/quiz-setup"
import { DbStatus } from "@/components/db-status"
import { Gamepad2, Trophy, Zap, Star } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full mb-4">
            <Gamepad2 className="h-6 w-6 inline-block mr-2" />
            <span className="font-bold">Code Quest</span>
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-indigo-700 mb-4">
            Test Your Coding Knowledge
          </h1>
          <p className="text-xl text-purple-600 max-w-2xl mx-auto">
            Challenge yourself with coding quizzes, earn XP, and climb the leaderboard!
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center bg-purple-100 px-4 py-2 rounded-full text-purple-800">
              <Zap className="h-5 w-5 mr-2 text-purple-600" />
              <span>Earn XP</span>
            </div>
            <div className="flex items-center bg-blue-100 px-4 py-2 rounded-full text-blue-800">
              <Star className="h-5 w-5 mr-2 text-blue-600" />
              <span>Level Up</span>
            </div>
            <Link href="/leaderboard" className="flex items-center bg-amber-100 px-4 py-2 rounded-full text-amber-800">
              <Trophy className="h-5 w-5 mr-2 text-amber-600" />
              <span>Compete</span>
            </Link>
          </div>
        </div>
        <div className="mb-4">
          <DbStatus />
        </div>
        <QuizSetup />
      </div>
    </main>
  )
}
