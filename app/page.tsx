import QuizSetup from "@/components/quiz-setup"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-purple-100">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">Code Quest</h1>
          <p className="text-lg text-purple-600">Test your coding knowledge and climb the leaderboard!</p>
        </div>
        <QuizSetup />
      </div>
    </main>
  )
}
