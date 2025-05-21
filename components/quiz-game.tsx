"use client"

import type React from "react"

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
  Brain,
  Shield,
  Target,
  Gift,
} from "lucide-react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"
import { saveQuizResult } from "@/lib/quiz-service"
import { createAudio, playSound } from "@/lib/sound-utils"

type Question = {
  id: string
  question: string
  options: string[]
  correctAnswer?: string
  fromFallback?: boolean
  source?: string
  reason?: string
  errorDetails?: string
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

// Achievement types
type Achievement = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

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
  const [apiStatus, setApiStatus] = useState<{
    source: string
    reason: string
    errorDetails?: string
  } | null>(null)

  // New gamified UI states
  const [showPowerup, setShowPowerup] = useState(false)
  const [powerupType, setPowerupType] = useState<string | null>(null)
  const [comboMultiplier, setComboMultiplier] = useState(1)
  const [showComboMessage, setShowComboMessage] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_correct",
      title: "First Step",
      description: "Answer your first question correctly",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      unlocked: false,
    },
    {
      id: "streak_3",
      title: "On Fire",
      description: "Get a streak of 3 correct answers",
      icon: <Flame className="h-6 w-6 text-orange-500" />,
      unlocked: false,
    },
    {
      id: "speed_demon",
      title: "Speed Demon",
      description: "Answer correctly in under 10 seconds",
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      unlocked: false,
    },
    {
      id: "quiz_master",
      title: "Quiz Master",
      description: "Complete a quiz with at least 80% correct answers",
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      unlocked: false,
      progress: 0,
      maxProgress: 100,
    },
    {
      id: "level_up",
      title: "Level Up",
      description: "Reach level 2",
      icon: <Target className="h-6 w-6 text-green-500" />,
      unlocked: false,
    },
  ])
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null)
  const [answerTime, setAnswerTime] = useState<number | null>(null)
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
  const [showFeedbackAnimation, setShowFeedbackAnimation] = useState(false)
  const [feedbackAnimationType, setFeedbackAnimationType] = useState<"correct" | "incorrect" | null>(null)

  // Sound effect references
  const [sounds, setSounds] = useState<{
    correct: HTMLAudioElement | null
    incorrect: HTMLAudioElement | null
    achievement: HTMLAudioElement | null
    levelUp: HTMLAudioElement | null
  }>({
    correct: null,
    incorrect: null,
    achievement: null,
    levelUp: null,
  })

  // Initialize sound effects
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSounds({
        correct: createAudio("/sounds/correct.mp3"),
        incorrect: createAudio("/sounds/incorrect.mp3"),
        achievement: createAudio("/sounds/achievement.mp3"),
        levelUp: createAudio("/sounds/level-up.mp3"),
      })
    }
  }, [])

  const [soundsEnabled, setSoundsEnabled] = useState(true)

  // Initialize sound effects with better error handling
  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     try {
  //       // Create audio elements but don't set src yet
  //       correctSoundRef.current = new Audio()
  //       incorrectSoundRef.current = new Audio()
  //       achievementSoundRef.current = new Audio()
  //       levelUpSoundRef.current = new Audio()

  //       // Set sources with error handling
  //       const setAudioSource = (audioRef: React.RefObject<HTMLAudioElement>, path: string) => {
  //         if (audioRef.current) {
  //           audioRef.current.src = path
  //           // Add error handler
  //           audioRef.current.onerror = () => {
  //             console.log(`Failed to load sound: ${path}`)
  //             setSoundsEnabled(false)
  //           }
  //         }
  //       }

  //       // Try to set sources
  //       setAudioSource(correctSoundRef, "/sounds/correct.mp3")
  //       setAudioSource(incorrectSoundRef, "/sounds/incorrect.mp3")
  //       setAudioSource(achievementSoundRef, "/sounds/achievement.mp3")
  //       setAudioSource(levelUpSoundRef, "/sounds/level-up.mp3")
  //     } catch (error) {
  //       console.error("Error initializing sound effects:", error)
  //       setSoundsEnabled(false)
  //     }
  //   }
  // }, [])

  // Helper function to play sounds safely
  // const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
  //   if (soundsEnabled && audioRef.current) {
  //     audioRef.current.play().catch(error => {
  //       console.log("Error playing sound:", error)
  //       // Disable sounds if we encounter an error
  //       setSoundsEnabled(false)
  //     })
  //   }
  // }

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
        const usingFallbackQuestions =
          generatedQuestions.length > 0 && (generatedQuestions[0].correctAnswer || generatedQuestions[0].fromFallback)

        setUsingFallback(usingFallbackQuestions)

        // If the response included API status info
        if ("source" in generatedQuestions && "reason" in generatedQuestions) {
          setApiStatus({
            source: generatedQuestions.source,
            reason: generatedQuestions.reason,
            errorDetails: generatedQuestions.errorDetails,
          })
        }

        setQuizState("playing")

        // Start answer timer
        setAnswerTime(Date.now())
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

      // Play level up sound
      playSound(sounds.levelUp)

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

      // Check for level up achievement
      if (newLevel >= 2) {
        unlockAchievement("level_up")
      }

      // Hide level up message after 3 seconds
      setTimeout(() => {
        setShowLevelUp(false)
      }, 3000)
    }
  }, [xpPoints, level])

  // Update quiz master achievement progress
  useEffect(() => {
    if (questions.length > 0) {
      const percentage = (correctAnswersCount / questions.length) * 100
      setAchievements((prev) => prev.map((a) => (a.id === "quiz_master" ? { ...a, progress: percentage } : a)))

      // Check if achievement should be unlocked
      if (percentage >= 80 && quizState === "completed") {
        unlockAchievement("quiz_master")
      }
    }
  }, [correctAnswersCount, questions.length, quizState])

  // Function to unlock achievements
  const unlockAchievement = (achievementId: string) => {
    const achievement = achievements.find((a) => a.id === achievementId)
    if (achievement && !achievement.unlocked) {
      // Update achievement state
      setAchievements((prev) => prev.map((a) => (a.id === achievementId ? { ...a, unlocked: true } : a)))

      // Show achievement notification
      setShowAchievement(achievement)

      // Play achievement sound
      playSound(sounds.achievement)

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowAchievement(null)
      }, 3000)
    }
  }

  // Function to check for powerups
  const checkForPowerup = () => {
    // Random chance to get a powerup (20%)
    if (Math.random() < 0.2) {
      const powerups = ["double_xp", "time_bonus", "hint"]
      const randomPowerup = powerups[Math.floor(Math.random() * powerups.length)]
      setPowerupType(randomPowerup)
      setShowPowerup(true)

      // Hide powerup notification after 3 seconds
      setTimeout(() => {
        setShowPowerup(false)
      }, 3000)
    }
  }

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
      // Calculate answer time
      const endTime = Date.now()
      const timeTaken = answerTime ? (endTime - answerTime) / 1000 : 0

      // If we have the correct answer directly in the question object (fallback questions)
      if (currentQuestion.correctAnswer) {
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer
        setIsAnswerCorrect(isCorrect)
        setFeedback(
          isCorrect
            ? "Correct! Your answer matches our solution."
            : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`,
        )

        // Show feedback animation
        setFeedbackAnimationType(isCorrect ? "correct" : "incorrect")
        setShowFeedbackAnimation(true)
        setTimeout(() => setShowFeedbackAnimation(false), 1000)

        // Play sound effect
        if (isCorrect) {
          playSound(sounds.correct)
        } else {
          playSound(sounds.incorrect)
        }

        // Calculate XP and update streak
        if (isCorrect) {
          // Increment correct answers count
          setCorrectAnswersCount((prev) => prev + 1)

          // Check for first correct answer achievement
          if (correctAnswersCount === 0) {
            unlockAchievement("first_correct")
          }

          // Check for speed demon achievement
          if (timeTaken < 10) {
            unlockAchievement("speed_demon")
          }

          const newStreak = streak + 1
          setStreak(newStreak)

          // Check for streak achievement
          if (newStreak >= 3) {
            unlockAchievement("streak_3")
          }

          // Update combo multiplier
          if (newStreak >= 3) {
            const newMultiplier = Math.min(3, 1 + Math.floor(newStreak / 3))
            if (newMultiplier > comboMultiplier) {
              setComboMultiplier(newMultiplier)
              setShowComboMessage(true)
              setTimeout(() => setShowComboMessage(false), 2000)
            }
          }

          // Base XP based on difficulty
          const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30

          // Bonus XP for streak
          const streakBonus = Math.min(newStreak * 2, 20) // Cap streak bonus at 20

          // Speed bonus (faster answers get more points)
          const speedBonus = Math.max(0, Math.floor(10 - timeTaken))

          // Apply combo multiplier
          const totalXp = (difficultyMultiplier + streakBonus + speedBonus) * comboMultiplier

          // Check for powerup bonus
          const finalXp = powerupType === "double_xp" ? totalXp * 2 : totalXp

          setXpPoints((prev) => prev + finalXp)

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

          // Random chance to get a powerup
          checkForPowerup()
        } else {
          // Reset streak and combo multiplier on wrong answer
          setStreak(0)
          setComboMultiplier(1)
        }
      } else {
        // Use the API for validation
        const result = await validateAnswer(currentQuestion, selectedAnswer, difficulty)
        setIsAnswerCorrect(result.isCorrect)
        setFeedback(result.feedback)

        // Show feedback animation
        setFeedbackAnimationType(result.isCorrect ? "correct" : "incorrect")
        setShowFeedbackAnimation(true)
        setTimeout(() => setShowFeedbackAnimation(false), 1000)

        // Play sound effect
        if (result.isCorrect) {
          playSound(sounds.correct)
        } else {
          playSound(sounds.incorrect)
        }

        // Calculate XP and update streak
        if (result.isCorrect) {
          // Increment correct answers count
          setCorrectAnswersCount((prev) => prev + 1)

          // Check for first correct answer achievement
          if (correctAnswersCount === 0) {
            unlockAchievement("first_correct")
          }

          // Check for speed demon achievement
          if (timeTaken < 10) {
            unlockAchievement("speed_demon")
          }

          const newStreak = streak + 1
          setStreak(newStreak)

          // Check for streak achievement
          if (newStreak >= 3) {
            unlockAchievement("streak_3")
          }

          // Update combo multiplier
          if (newStreak >= 3) {
            const newMultiplier = Math.min(3, 1 + Math.floor(newStreak / 3))
            if (newMultiplier > comboMultiplier) {
              setComboMultiplier(newMultiplier)
              setShowComboMessage(true)
              setTimeout(() => setShowComboMessage(false), 2000)
            }
          }

          // Base XP based on difficulty
          const difficultyMultiplier = difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30

          // Bonus XP for streak
          const streakBonus = Math.min(newStreak * 2, 20) // Cap streak bonus at 20

          // Speed bonus (faster answers get more points)
          const speedBonus = Math.max(0, Math.floor(10 - timeTaken))

          // Apply combo multiplier
          const totalXp = (difficultyMultiplier + streakBonus + speedBonus) * comboMultiplier

          // Check for powerup bonus
          const finalXp = powerupType === "double_xp" ? totalXp * 2 : totalXp

          setXpPoints((prev) => prev + finalXp)

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

          // Random chance to get a powerup
          checkForPowerup()
        } else {
          // Reset streak and combo multiplier on wrong answer
          setStreak(0)
          setComboMultiplier(1)
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
      // Reset powerup after use
      setPowerupType(null)
    }
  }

  const handleNextQuestion = () => {
    setSelectedAnswer(null)
    setIsAnswerCorrect(null)
    setFeedback("")

    // Reset answer timer for next question
    setAnswerTime(Date.now())

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
        correctAnswers: correctAnswersCount,
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
        <CardHeader className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-t-lg">
          <CardTitle>Loading Your Quest...</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
              }}
              className="relative w-24 h-24"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-purple-700 font-medium text-lg"
            >
              Preparing your knowledge challenge...
            </motion.p>
            <div className="mt-8 w-full max-w-md">
              <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5 }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs text-purple-600">
                <span>Gathering questions</span>
                <span>Calibrating difficulty</span>
                <span>Ready soon!</span>
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
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quest Loading Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-center text-red-800 mb-4 text-lg font-medium">
                We encountered an error while generating your quiz questions. This might be due to an issue with the
                Gemini API.
              </p>
            </motion.div>
            {errorMessage && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-red-50 p-4 rounded-lg mb-6 w-full border border-red-200"
              >
                <p className="text-sm text-red-800 font-mono">{errorMessage}</p>
              </motion.div>
            )}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
              <Button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 py-2 text-lg"
              >
                Return to Home Base
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizState === "submit-error") {
    return (
      <Card className="w-full shadow-lg border-purple-200">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Score Submission Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-center text-amber-800 mb-4 text-lg font-medium">
                We encountered an error while submitting your score to the leaderboard. This might be due to a temporary
                issue with our database.
              </p>
            </motion.div>
            {errorMessage && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-amber-50 p-4 rounded-lg mb-6 w-full border border-amber-200"
              >
                <p className="text-sm text-amber-800 font-mono">{errorMessage}</p>
              </motion.div>
            )}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4"
            >
              <Button variant="outline" onClick={() => router.push("/")} className="border-amber-200 text-amber-700">
                New Quest
              </Button>
              <Button
                onClick={handleRetrySubmit}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
              >
                Try Again
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizState === "completed") {
    return (
      <Card className="w-full shadow-lg border-purple-200 overflow-hidden relative">
        <div ref={confettiRef} className="absolute inset-0"></div>

        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"></div>

        <CardHeader className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white rounded-t-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/patterns/confetti.png')] opacity-10"></div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-7 w-7 text-yellow-300" />
            Quest Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 relative">
          <div className="flex flex-col items-center justify-center py-6 space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                Congratulations!
              </h2>
              <p className="text-purple-600 text-lg">You've completed the quest and earned valuable rewards!</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center shadow-md border border-purple-200 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/patterns/circuit.png')] opacity-5"></div>
                <div className="bg-gradient-to-br from-purple-200 to-purple-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Zap className="h-10 w-10 text-purple-700" />
                </div>
                <p className="text-sm text-purple-600 font-medium uppercase tracking-wider">XP Earned</p>
                <p className="text-3xl font-bold text-purple-800 mt-1">{xpPoints}</p>
                <div className="mt-2 text-xs text-purple-500">{correctAnswersCount} correct answers</div>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center shadow-md border border-blue-200 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/patterns/dots.png')] opacity-5"></div>
                <div className="bg-gradient-to-br from-blue-200 to-blue-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Clock className="h-10 w-10 text-blue-700" />
                </div>
                <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Time Taken</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">
                  {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
                </p>
                <div className="mt-2 text-xs text-blue-500">
                  {Math.round(elapsedTime / questions.length)}s per question
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center shadow-md border border-green-200 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/patterns/hexagons.png')] opacity-5"></div>
                <div className="bg-gradient-to-br from-green-200 to-green-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Award className="h-10 w-10 text-green-700" />
                </div>
                <p className="text-sm text-green-600 font-medium uppercase tracking-wider">Level</p>
                <p className="text-3xl font-bold text-green-800 mt-1">{level}</p>
                <div className="mt-2 text-xs text-green-500">{xpToNextLevel - xpPoints} XP to next level</div>
              </motion.div>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-purple-100"
            >
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-700">Level Progress</span>
                  <span className="text-xs text-purple-600 font-medium">{Math.round(xpProgress)}%</span>
                </div>
                <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-700"
                  ></motion.div>
                </div>
                <div className="flex justify-between text-xs text-purple-600 mt-1">
                  <span>Level {level}</span>
                  <span>
                    {xpPoints}/{xpToNextLevel} XP
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Achievements Unlocked
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {achievements
                    .filter((a) => a.unlocked)
                    .map((achievement) => (
                      <div
                        key={achievement.id}
                        className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200 flex items-center gap-3"
                      >
                        <div className="bg-amber-200 rounded-full p-2 flex-shrink-0">{achievement.icon}</div>
                        <div>
                          <p className="font-medium text-amber-800 text-sm">{achievement.title}</p>
                          <p className="text-xs text-amber-600">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  {achievements.filter((a) => a.unlocked).length === 0 && (
                    <div className="col-span-2 text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-500 text-sm">No achievements unlocked yet</p>
                    </div>
                  )}
                </div>
              </div>

              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your name for the leaderboard
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Your name"
              />
            </motion.div>

            {dbStatus && (
              <div
                className={`p-4 ${dbStatus.success ? "bg-green-50" : "bg-amber-50"} rounded-lg w-full border ${dbStatus.success ? "border-green-200" : "border-amber-200"}`}
              >
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
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-full shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-300 p-2 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-100">LEVEL UP!</p>
                    <p className="font-bold text-xl">You reached level {level}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between p-6 bg-gray-50 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-2"
          >
            New Quest
          </Button>
          <Button
            onClick={handleSubmitScore}
            disabled={!username.trim() || isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-2 text-lg"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Submitting...
              </>
            ) : (
              <>
                <Trophy className="h-5 w-5 mr-2" />
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
      {/* Game HUD */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-md border border-purple-100">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`${getDifficultyColor()} px-3 py-1.5`}>
            <Shield className="h-4 w-4 mr-1" />
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1.5">
            <Brain className="h-4 w-4 mr-1" />
            {topics}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-1.5 rounded-full text-purple-800 text-sm font-medium flex items-center shadow-sm border border-purple-200"
            >
              <Zap className="h-4 w-4 mr-1 text-purple-600" />
              <span>{xpPoints} XP</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-amber-100 to-amber-200 px-3 py-1.5 rounded-full text-amber-800 text-sm font-medium flex items-center shadow-sm border border-amber-200"
            >
              <Star className="h-4 w-4 mr-1 text-amber-600" />
              <span>Lvl {level}</span>
            </motion.div>
            {streak > 0 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-r from-red-100 to-red-200 px-3 py-1.5 rounded-full text-red-800 text-sm font-medium flex items-center shadow-sm border border-red-200"
              >
                <Flame className="h-4 w-4 mr-1 text-red-600" />
                <span>{streak}x</span>
              </motion.div>
            )}
            {comboMultiplier > 1 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-r from-green-100 to-green-200 px-3 py-1.5 rounded-full text-green-800 text-sm font-medium flex items-center shadow-sm border border-green-200"
              >
                <Target className="h-4 w-4 mr-1 text-green-600" />
                <span>{comboMultiplier}x Combo</span>
              </motion.div>
            )}
          </div>
          <QuizTimer isRunning={quizState === "playing"} onTimeUpdate={setElapsedTime} />
        </div>
      </div>

      {/* Status messages */}
      {usingFallback && (
        <div className="p-3 bg-amber-50 rounded-lg flex items-start border border-amber-200">
          <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700">Using offline question bank</p>
            <p className="text-xs text-amber-600">
              We're currently using our built-in question database because we couldn't connect to the AI service. The
              questions are still high quality, but less customized to your specific topics.
            </p>
          </div>
        </div>
      )}

      {!usingFallback && (
        <div className="p-3 bg-blue-50 rounded-lg flex items-start border border-blue-200">
          <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">Questions generated by Gemini 1.5 Flash AI model.</p>
        </div>
      )}

      {apiStatus && apiStatus.reason === "expired_api_key" && (
        <div className="p-3 bg-amber-50 rounded-lg flex items-start mb-4 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700">API Key Issue Detected</p>
            <p className="text-xs text-amber-600">
              {apiStatus.errorDetails || "The Gemini API key has expired. Using fallback questions instead."}
            </p>
          </div>
        </div>
      )}

      {dbStatus && !dbStatus.success && (
        <div className="p-3 bg-amber-50 rounded-lg flex items-start border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Database connection issue: {dbStatus.message}</p>
        </div>
      )}

      {/* Main quiz card */}
      <Card className="w-full shadow-lg border-purple-200 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/patterns/grid.png')] opacity-[0.02] pointer-events-none"></div>

        <CardHeader className="pb-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white relative">
          <div className="absolute inset-0 bg-[url('/patterns/topography.png')] opacity-10"></div>
          <div className="flex justify-between items-center mb-1 relative z-10">
            <CardTitle className="text-lg font-medium flex items-center">
              <span className="bg-white text-purple-800 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold shadow-md">
                {currentQuestionIndex + 1}
              </span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
          </div>
          <Progress
            value={progress}
            className="h-2.5 bg-purple-300/50"
            indicatorClassName="bg-gradient-to-r from-white to-purple-100"
          />
        </CardHeader>
        <CardContent className="pt-6 relative">
          {currentQuestion && (
            <div className="space-y-6">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-medium bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-lg border-l-4 border-purple-500 shadow-sm"
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
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAnswer === option
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${
                            selectedAnswer === option
                              ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                              : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
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
                      isAnswerCorrect
                        ? "bg-gradient-to-r from-green-50 to-green-100 border border-green-200"
                        : "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
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
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="bg-green-100 px-2 py-1 rounded text-xs text-green-800 flex items-center border border-green-200">
                              <Zap className="h-3 w-3 mr-1" />
                              Base XP: +{difficulty === "beginner" ? 10 : difficulty === "intermediate" ? 20 : 30}
                            </div>
                            {streak > 1 && (
                              <div className="bg-amber-100 px-2 py-1 rounded text-xs text-amber-800 flex items-center border border-amber-200">
                                <Flame className="h-3 w-3 mr-1" />
                                Streak bonus: +{Math.min(streak * 2, 20)}
                              </div>
                            )}
                            {comboMultiplier > 1 && (
                              <div className="bg-blue-100 px-2 py-1 rounded text-xs text-blue-800 flex items-center border border-blue-200">
                                <Target className="h-3 w-3 mr-1" />
                                Combo: x{comboMultiplier}
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

          {/* Feedback animation */}
          <AnimatePresence>
            {showFeedbackAnimation && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {feedbackAnimationType === "correct" ? (
                  <div className="text-green-500 text-9xl">
                    <CheckCircle />
                  </div>
                ) : (
                  <div className="text-red-500 text-9xl">
                    <XCircle />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievement notification */}
          <AnimatePresence>
            {showAchievement && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute bottom-4 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-lg shadow-lg max-w-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-400 p-2 rounded-full">{showAchievement.icon}</div>
                  <div>
                    <p className="text-xs font-medium text-amber-100">ACHIEVEMENT UNLOCKED</p>
                    <p className="font-bold">{showAchievement.title}</p>
                    <p className="text-xs text-amber-100">{showAchievement.description}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Powerup notification */}
          <AnimatePresence>
            {showPowerup && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute bottom-4 left-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg max-w-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-400 p-2 rounded-full">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-100">POWERUP ACTIVATED</p>
                    <p className="font-bold">
                      {powerupType === "double_xp" && "Double XP"}
                      {powerupType === "time_bonus" && "Time Bonus"}
                      {powerupType === "hint" && "Hint Available"}
                    </p>
                    <p className="text-xs text-blue-100">
                      {powerupType === "double_xp" && "Your next correct answer gives double XP!"}
                      {powerupType === "time_bonus" && "30 seconds added to your time!"}
                      {powerupType === "hint" && "Use a hint on your next question!"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Combo message */}
          <AnimatePresence>
            {showComboMessage && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="font-bold text-xl">{comboMultiplier}x COMBO!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between p-4 bg-gray-50 border-t border-gray-100">
          {isAnswerCorrect === null ? (
            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer || isCheckingAnswer}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white w-full py-6 text-lg font-medium shadow-md"
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
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white w-full py-6 text-lg font-medium shadow-md"
            >
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quest"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
