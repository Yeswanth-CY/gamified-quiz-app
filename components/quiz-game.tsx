"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { generateQuestions, validateAnswer } from "@/lib/quiz-service"
import { QuizTimer } from "@/components/quiz-timer"
import { Badge } from "@/components/ui/badge"
import { saveQuizResult } from "@/lib/quiz-actions"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer?: string
}

type QuizState =
  | "loading"
  | "playing"
  | "reviewing"
  | "completed"
  | "error"
  | "validation-error"
  | "submit-error"
  | "fallback"

export function QuizGame({
  topics,
  difficulty,
  questionCount,
}: {
  topics: string
  difficulty: string
  questionCount: number
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null)
  const [quizState, setQuizState] = useState<QuizState>("loading")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [xpPoints, setXpPoints] = useState(0)
  const [username, setUsername] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  // Load questions when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const generatedQuestions = await generateQuestions(topics, difficulty, questionCount)
        setQuestions(generatedQuestions)

        // Check if we're using fallback questions (no API)
        if (generatedQuestions.length > 0 && !generatedQuestions[0].hasOwnProperty("apiGenerated")) {
          setUsingFallback(true)
        }

        setQuizState("playing")
      } catch (error) {
        console.error("Error loading questions:", error)
        setErrorMessage(error instanceof Error ? error.message : "Unknown error")
        setQuizState("error")
      }
    }

    loadQuestions()
  }, [topics, difficulty, questionCount])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = (currentQuestionIndex / questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    if (quizState !== "playing" || isAnswerCorrect !== null || isCheckingAnswer) return
    setSelectedAnswer(answer)
  }

  const handleCheckAnswer = async () => {
    if (!selectedAnswer || isAnswerCorrect !== null || isCheckingAnswer) return

    setIsCheckingAnswer(true)
    try {
      // If we're using fallback questions, do a simple comparison
      if (usingFallback) {
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer
        setIsAnswerCorrect(isCorrect)
        setFeedback(
          isCorrect
            ? "Correct! Your answer matches our solution."
            : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
        )

        // Calculate XP
        if (isCorrect) {
          const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30
          setXpPoints((prev) => prev + difficultyMultiplier)
        }
      } else {
        // Use the API for validation
        const result = await validateAnswer(currentQuestion.question, selectedAnswer, difficulty)
        setIsAnswerCorrect(result.isCorrect)
        setFeedback(result.feedback)

        // Calculate XP based on difficulty and correctness
        if (result.isCorrect) {
          const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30
          setXpPoints((prev) => prev + difficultyMultiplier)
        }
      }
    } catch (error) {
      console.error("Error validating answer:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")

      // If we can't validate the answer, let's assume it's correct and continue
      setIsAnswerCorrect(true)
      setFeedback("We couldn't validate your answer due to a technical issue, but we'll give you credit for it.")
    } finally {
      setIsCheckingAnswer(false)
    }
  }

  const handleNextQuestion = () => {
    setSelectedAnswer(null)
    setIsAnswerCorrect(null)
    setFeedback("")

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setQuizState("completed")
    }
  }

  const handleSubmitScore = async () => {
    if (!username.trim()) return

    setIsSubmitting(true)

    try {
      await saveQuizResult({
        username,
        topics: topics.split(",").map((t) => t.trim()),
        difficulty,
        xpPoints,
        timeInSeconds: elapsedTime,
        questionsCount: questions.length,
        correctAnswers: xpPoints / (difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30),
      })

      router.push("/leaderboard")
    } catch (error) {
      console.error("Error submitting score:", error)
      setIsSubmitting(false)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      setQuizState("submit-error")
    }
  }

  const handleRetrySubmit = () => {
    setQuizState("completed")
    setIsSubmitting(false)
  }

  if (quizState === "loading") {
    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-purple-700 text-white rounded-t-lg">
          <CardTitle>Loading Quiz...</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            <p className="mt-4 text-purple-700">Generating your questions...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizState === "error") {
    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-red-600 text-white rounded-t-lg">
          <CardTitle>Error Loading Quiz</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-center text-red-800 mb-4">
              We encountered an error while generating your quiz questions. This might be due to an issue with the
              Gemini API.
            </p>
            {errorMessage && (
              <div className="bg-red-50 p-4 rounded-lg mb-6 w-full">
                <p className="text-sm text-red-800 font-mono">{errorMessage}</p>
              </div>
            )}
            <Button onClick={() => router.push("/")} className="bg-purple-700 hover:bg-purple-800">
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizState === "submit-error") {
    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-amber-500 text-white rounded-t-lg">
          <CardTitle>Error Submitting Score</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-center text-amber-800 mb-4">
              We encountered an error while submitting your score to the leaderboard. This might be due to a temporary
              issue with our database.
            </p>
            {errorMessage && (
              <div className="bg-amber-50 p-4 rounded-lg mb-6 w-full">
                <p className="text-sm text-amber-800 font-mono">{errorMessage}</p>
              </div>
            )}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push("/")}>
                New Quiz
              </Button>
              <Button onClick={handleRetrySubmit} className="bg-purple-700 hover:bg-purple-800">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizState === "completed") {
    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-purple-700 text-white rounded-t-lg">
          <CardTitle>Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-purple-800">Congratulations!</h2>
              <p className="text-gray-600 mt-2">You've completed the quiz.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-600">XP Earned</p>
                <p className="text-2xl font-bold text-purple-800">{xpPoints}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-600">Time Taken</p>
                <p className="text-2xl font-bold text-purple-800">
                  {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
                </p>
              </div>
            </div>

            <div className="w-full max-w-md mt-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Enter your name for the leaderboard
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Your name"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            New Quiz
          </Button>
          <Button
            onClick={handleSubmitScore}
            disabled={!username.trim() || isSubmitting}
            className="bg-purple-700 hover:bg-purple-800"
          >
            {isSubmitting ? "Submitting..." : "Submit Score"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
          <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
            {topics}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-800 text-sm font-medium">XP: {xpPoints}</div>
          <QuizTimer isRunning={quizState === "playing"} onTimeUpdate={setElapsedTime} />
        </div>
      </div>

      {usingFallback && (
        <div className="p-3 bg-amber-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Note: We're using pre-generated questions because the Gemini API is currently unavailable.
          </p>
        </div>
      )}

      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-lg font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="pt-4">
          {currentQuestion && (
            <div className="space-y-4">
              <div className="text-lg font-medium">{currentQuestion.question}</div>

              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAnswer === option
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-2">
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center ${
                            selectedAnswer === option ? "bg-purple-500 text-white" : "bg-gray-200"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                      </div>
                      <div className="flex-1">{option}</div>
                    </div>
                  </div>
                ))}
              </div>

              {isAnswerCorrect !== null && (
                <div
                  className={`p-4 rounded-lg ${
                    isAnswerCorrect ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-2">
                      {isAnswerCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isAnswerCorrect ? "text-green-800" : "text-red-800"}`}>
                        {isAnswerCorrect ? "Correct!" : "Incorrect"}
                      </p>
                      <p className="text-sm mt-1">{feedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isAnswerCorrect === null ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer || isCheckingAnswer}
              className="bg-purple-700 hover:bg-purple-800 w-full"
            >
              {isCheckingAnswer ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Checking...
                </>
              ) : (
                "Check Answer"
              )}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="bg-purple-700 hover:bg-purple-800 w-full">
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
