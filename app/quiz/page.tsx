import { Suspense } from "react"
import { QuizGame } from "@/components/quiz-game"
import { Skeleton } from "@/components/ui/skeleton"

export default function QuizPage({
  searchParams,
}: {
  searchParams: { topics?: string; difficulty?: string; count?: string }
}) {
  const topics = searchParams.topics || ""
  const difficulty = searchParams.difficulty || "beginner"
  const count = Number.parseInt(searchParams.count || "5", 10)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-purple-100">
      <div className="w-full max-w-4xl">
        <Suspense fallback={<QuizSkeleton />}>
          <QuizGame topics={topics} difficulty={difficulty} questionCount={count} />
        </Suspense>
      </div>
    </main>
  )
}

function QuizSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
