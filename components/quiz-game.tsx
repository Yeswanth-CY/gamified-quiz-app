"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { generateQuestions, validateAnswer } from "@/lib/quiz-service"
import { QuizTimer } from "@/components/quiz-timer"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Database,
  Zap,
  Award,
  Star,
  Trophy,
  Flame,
  Clock,
} from "lucide-react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import { saveQuizResult } from "@/lib/quiz-service" // Declare the variable before using it

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer?: string
  fromFallback?: boolean
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
  const [dbStatus, setDbStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [xpToNextLevel, setXpToNextLevel] = useState(100)
  const [xpProgress, setXpProgress] = useState(0)
  const confettiRef = useRef<HTMLDivElement>(null)

  // Check database status when component mounts
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch("/api/setup-db")
        const data = await response.json()

        setDbStatus({
          success: response.ok && !data.error,
          message: data.message || "Database connection verified",
        })

        if (!response.ok || data.error) {
          console.log("Database setup issue:", data)
        } else {
          console.log("Database setup successful:", data)
        }
      } catch (error) {
        console.error("Error checking database status:", error)
        setDbStatus({
          success: false,
          message: "Failed to connect to database",
        })
      }
    }

    checkDbStatus()
  }, [])

  // Load questions when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const generatedQuestions = await generateQuestions(topics, difficulty, questionCount)
        setQuestions(generatedQuestions)

        // Check if we're using fallback questions (they have correctAnswer property or fromFallback flag)
        if (
          generatedQuestions.length > 0 &&
          (generatedQuestions[0].correctAnswer || generatedQuestions[0].fromFallback)
        ) {
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

  // Update XP progress
  useEffect(() => {
    const xpNeeded = level * 100
    setXpToNextLevel(xpNeeded)
    const progress = (xpPoints / xpNeeded) * 100
    setXpProgress(Math.min(progress, 100))

    // Check for level up
    if (xpPoints >= xpNeeded && level * 100 < xpPoints) {
      const newLevel = Math.floor(xpPoints / 100) + 1
      setLevel(newLevel)
      setShowLevelUp(true)

      // Trigger confetti
      if (confettiRef.current) {
        const rect = confettiRef.current.getBoundingClientRect()
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
        })
      }

      // Hide level up message after 3 seconds
      setTimeout(() => {
        setShowLevelUp(false)
      }, 3000)
    }
  }, [xpPoints, level])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = (currentQuestionIndex / questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    if (quizState !== "playing" || isAnswerCorrect !== null || isCheckingAnswer) return
    setSelectedAnswer(answer)
  }

  async function handleCheckAnswer() {
    if (!selectedAnswer || isAnswerCorrect !== null || isCheckingAnswer) return

    setIsCheckingAnswer(true)
    try {
      // If we have the correct answer directly in the question object (fallback questions)
      if (currentQuestion.correctAnswer) {
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer
        setIsAnswerCorrect(isCorrect)
        setFeedback(
          isCorrect
            ? "Correct! Your answer matches our solution."
            : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
        )

        // Calculate XP and update streak
        if (isCorrect) {
          const newStreak = streak + 1
          setStreak(newStreak)

          // Base XP based on difficulty
          const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30

          // Bonus XP for streak
          const streakBonus = Math.min(newStreak * 2, 20) // Cap streak bonus at 20

          // Total XP for this question
          const questionXp = difficultyMultiplier + streakBonus

          setXpPoints((prev) => prev + questionXp)

          // Trigger confetti for correct answer
          if (confettiRef.current) {
            const rect = confettiRef.current.getBoundingClientRect()
            confetti({
              particleCount: 30,
              spread: 50,
              origin: {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
              },
            })
          }
        } else {
          // Reset streak on wrong answer
          setStreak(0)
        }
      } else {
        // Use the API for validation
        const result = await validateAnswer(currentQuestion, selectedAnswer, difficulty)
        setIsAnswerCorrect(result.isCorrect)
        setFeedback(result.feedback)

        // Calculate XP and update streak
        if (result.isCorrect) {
          const newStreak = streak + 1
          setStreak(newStreak)

          // Base XP based on difficulty
          const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30

          // Bonus XP for streak
          const streakBonus = Math.min(newStreak * 2, 20) // Cap streak bonus at 20

          // Total XP for this question
          const questionXp = difficultyMultiplier + streakBonus

          setXpPoints((prev) => prev + questionXp)

          // Trigger confetti for correct answer
          if (confettiRef.current) {
            const rect = confettiRef.current.getBoundingClientRect()
            confetti({
              particleCount: 30,
              spread: 50,
              origin: {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
              },
            })
          }
        } else {
          // Reset streak on wrong answer
          setStreak(0)
        }
      }
    } catch (error) {
      console.error("Error validating answer:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")

      // If we can't validate the answer, let's assume it's correct and continue
      setIsAnswerCorrect(true)
      setFeedback("We couldn't validate your answer due to a technical issue, but we'll give you credit for it.")

      // Give some XP anyway
      const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30
      setXpPoints((prev) => prev + difficultyMultiplier)
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

      // Big confetti celebration for completing the quiz
      if (confettiRef.current) {
        const rect = confettiRef.current.getBoundingClientRect()
        confetti({
          particleCount: 200,
          spread: 100,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
        })
      }
    }
  }

  const handleSubmitScore = async () => {
    if (!username.trim()) return

    setIsSubmitting(true)

    try {
      const result = await saveQuizResult({
        username,
        topics: topics.split(",").map((t) => t.trim()),
        difficulty,
        xpPoints,
        timeInSeconds: elapsedTime,
        questionsCount: questions.length,
        correctAnswers: Math.round(
          xpPoints / (difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30),
        ),
      })

      console.log("Score submission result:", result)
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

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "intermediate":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "advanced":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
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
            <p className="mt-4 text-purple-700">Generating your questions using Gemini 1.5 Flash...</p>
            <div className="mt-8 w-full max-w-md">
              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs text-purple-600">
                <span>Preparing questions</span>
                <span>Setting up challenge</span>
              </div>
            </div>
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
      <Card className="w-full shadow-lg border-purple-200 overflow-hidden">
        <div ref={confettiRef} className="absolute inset-0"></div>
        <CardHeader className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Quiz Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-purple-800 mb-2">Congratulations!</h2>
              <p className="text-purple-600">You've completed the quiz and earned valuable XP!</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center shadow-md"
              >
                <div className="bg-purple-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="h-8 w-8 text-purple-700" />
                </div>
                <p className="text-sm text-purple-600">XP Earned</p>
                <p className="text-2xl font-bold text-purple-800">{xpPoints}</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center shadow-md"
              >
                <div className="bg-blue-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-8 w-8 text-blue-700" />
                </div>
                <p className="text-sm text-blue-600">Time Taken</p>
                <p className="text-2xl font-bold text-blue-800">
                  {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center shadow-md"
              >
                <div className="bg-green-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="h-8 w-8 text-green-700" />
                </div>
                <p className="text-sm text-green-600">Level</p>
                <p className="text-2xl font-bold text-green-800">{level}</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-md bg-white p-6 rounded-lg shadow-md"
            >
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-purple-700">Level Progress</span>
                  <span className="text-xs text-purple-600">{Math.round(xpProgress)}%</span>
                </div>
                <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-1000"
                    style={{ width: `${xpProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-purple-600 mt-1">
                  <span>Level {level}</span>
                  <span>
                    {xpPoints}/{xpToNextLevel} XP
                  </span>
                </div>
              </div>

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
            </motion.div>

            {dbStatus && (
              <div className={`p-4 ${dbStatus.success ? "bg-green-50" : "bg-amber-50"} rounded-lg w-full`}>
                <div className="flex items-start">
                  <Database
                    className={`h-5 w-5 ${dbStatus.success ? "text-green-500" : "text-amber-500"} mr-2 flex-shrink-0 mt-0.5`}
                  />
                  <div>
                    <p className={`text-sm font-medium ${dbStatus.success ? "text-green-700" : "text-amber-700"}`}>
                      {dbStatus.success ? "Database Connected" : "Database Connection Issue"}
                    </p>
                    <p className={`text-xs ${dbStatus.success ? "text-green-600" : "text-amber-600"} mt-1`}>
                      {dbStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Level up notification */}
          <AnimatePresence>
            {showLevelUp && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-100" />
                  <span className="font-bold">Level Up! You reached level {level}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between bg-gray-50 p-4">
          <Button variant="outline" onClick={() => router.push("/")} className="border-purple-200 text-purple-700">
            New Quiz
          </Button>
          <Button
            onClick={handleSubmitScore}
            disabled={!username.trim() || isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Submitting...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Submit Score
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-4" ref={confettiRef}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`${getDifficultyColor()}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            {topics}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-800 text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-1 text-purple-600" />
              <span>{xpPoints} XP</span>
            </div>
            <div className="bg-amber-100 px-3 py-1 rounded-full text-amber-800 text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-1 text-amber-600" />
              <span>Lvl {level}</span>
            </div>
            {streak > 0 && (
              <div className="bg-red-100 px-3 py-1 rounded-full text-red-800 text-sm font-medium flex items-center">
                <Flame className="h-4 w-4 mr-1 text-red-600" />
                <span>{streak}x</span>
              </div>
            )}
          </div>
          <QuizTimer isRunning={quizState === "playing"} onTimeUpdate={setElapsedTime} />
        </div>
      </div>

      {usingFallback && (
        <div className="p-3 bg-amber-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Dont copy</p>
        </div>
      )}

      {!usingFallback && (
        <div className="p-3 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">Questions generated by Gemini 1.5 Flash AI model.</p>
        </div>
      )}

      {dbStatus && !dbStatus.success && (
        <div className="p-3 bg-amber-50 rounded-lg flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Database connection issue: {dbStatus.message}</p>
        </div>
      )}

      <Card className="w-full shadow-lg border-purple-200 overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-lg font-medium flex items-center">
              <span className="bg-white text-purple-800 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">
                {currentQuestionIndex + 1}
              </span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
          </div>
          <Progress value={progress} className="h-2 bg-purple-300" indicatorClassName="bg-white" />
        </CardHeader>
        <CardContent className="pt-6">
          {currentQuestion && (
            <div className="space-y-6">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-medium bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500"
              >
                {currentQuestion.question}
              </motion.div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-[1.01] ${
                      selectedAnswer === option
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center ${
                            selectedAnswer === option ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">{option}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {isAnswerCorrect !== null && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-lg ${
                      isAnswerCorrect ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-2">
                        {isAnswerCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isAnswerCorrect ? "text-green-800" : "text-red-800"}`}>
                          {isAnswerCorrect ? "Correct!" : "Incorrect"}
                        </p>
                        <p className="text-sm mt-1">{feedback}</p>

                        {isAnswerCorrect && (
                          <div className="mt-2 flex items-center">
                            <div className="bg-green-100 px-2 py-1 rounded text-xs text-green-800 flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              Base XP: +{difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30}
                            </div>
                            {streak > 1 && (
                              <div className="bg-amber-100 ml-2 px-2 py-1 rounded text-xs text-amber-800 flex items-center">
                                <Flame className="h-3 w-3 mr-1" />
                                Streak bonus: +{Math.min(streak * 2, 20)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between p-4 bg-gray-50">
          {isAnswerCorrect === null ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer || isCheckingAnswer}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white w-full py-6"
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
            <Button
              onClick={handleNextQuestion}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white w-full py-6"
            >
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
