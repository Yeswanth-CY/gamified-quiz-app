"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Gamepad2, Trophy, Clock, Zap, Brain, Swords, Shield, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { ApiStatus } from "@/components/api-status"

export default function QuizSetup() {
  const router = useRouter()
  const [topics, setTopics] = useState("")
  const [difficulty, setDifficulty] = useState("beginner")
  const [questionCount, setQuestionCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(0)

  const avatars = [
    { icon: <Brain className="h-8 w-8" />, color: "bg-purple-100 text-purple-600" },
    { icon: <Swords className="h-8 w-8" />, color: "bg-red-100 text-red-600" },
    { icon: <Shield className="h-8 w-8" />, color: "bg-blue-100 text-blue-600" },
    { icon: <Sparkles className="h-8 w-8" />, color: "bg-amber-100 text-amber-600" },
  ]

  const handleStartQuiz = async () => {
    if (!topics.trim()) return

    setIsLoading(true)

    try {
      // Navigate to the quiz page with the selected parameters
      router.push(`/quiz?topics=${encodeURIComponent(topics)}&difficulty=${difficulty}&count=${questionCount}`)
    } catch (error) {
      console.error("Error starting quiz:", error)
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4">
        <ApiStatus />
      </div>
      <Card className="w-full shadow-lg border-purple-200 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-[0.02] pointer-events-none"></div>

        <CardHeader className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white relative">
          <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-10"></div>
          <CardTitle className="flex items-center gap-2 text-2xl relative z-10">
            <Gamepad2 className="h-6 w-6" />
            Quest Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-2">
          <div className="space-y-6">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="topics" className="text-lg font-medium flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Topics
              </Label>
              <Input
                id="topics"
                placeholder="e.g. Python, Java, SQL"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="border-purple-200 focus:border-purple-400 text-lg p-6 shadow-sm"
              />
              <p className="text-sm text-gray-500">Enter programming languages or topics separated by commas</p>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-2"
            >
              <Label className="text-lg font-medium flex items-center gap-2">
                <Swords className="h-5 w-5 text-purple-600" />
                Difficulty Level
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    difficulty === "beginner"
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-md"
                      : "border-gray-200 hover:border-green-200 hover:bg-green-50"
                  }`}
                  onClick={() => setDifficulty("beginner")}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        difficulty === "beginner" ? "bg-gradient-to-br from-green-100 to-green-200" : "bg-gray-100"
                      }`}
                    >
                      <Shield className={`h-6 w-6 ${difficulty === "beginner" ? "text-green-600" : "text-gray-400"}`} />
                    </div>
                    <div className="ml-3">
                      <h3 className={`font-medium ${difficulty === "beginner" ? "text-green-800" : "text-gray-700"}`}>
                        Beginner
                      </h3>
                      <p className="text-xs text-gray-500">Basic concepts</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    difficulty === "intermediate"
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                      : "border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                  onClick={() => setDifficulty("intermediate")}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        difficulty === "intermediate" ? "bg-gradient-to-br from-blue-100 to-blue-200" : "bg-gray-100"
                      }`}
                    >
                      <Swords
                        className={`h-6 w-6 ${difficulty === "intermediate" ? "text-blue-600" : "text-gray-400"}`}
                      />
                    </div>
                    <div className="ml-3">
                      <h3
                        className={`font-medium ${difficulty === "intermediate" ? "text-blue-800" : "text-gray-700"}`}
                      >
                        Intermediate
                      </h3>
                      <p className="text-xs text-gray-500">Advanced concepts</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    difficulty === "advanced"
                      ? "border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                  }`}
                  onClick={() => setDifficulty("advanced")}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        difficulty === "advanced" ? "bg-gradient-to-br from-purple-100 to-purple-200" : "bg-gray-100"
                      }`}
                    >
                      <Sparkles
                        className={`h-6 w-6 ${difficulty === "advanced" ? "text-purple-600" : "text-gray-400"}`}
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className={`font-medium ${difficulty === "advanced" ? "text-purple-800" : "text-gray-700"}`}>
                        Advanced
                      </h3>
                      <p className="text-xs text-gray-500">Expert challenges</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex justify-between">
                <Label className="text-lg font-medium flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Number of Questions: {questionCount}
                </Label>
              </div>
              <div className="px-2">
                <Slider
                  value={[questionCount]}
                  min={3}
                  max={10}
                  step={1}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>3</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-2"
            >
              <Label className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Choose Your Avatar
              </Label>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                {avatars.map((avatar, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      selectedAvatar === index
                        ? `${avatar.color} ring-2 ring-offset-2 ring-purple-500 shadow-lg`
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedAvatar(index)}
                  >
                    {avatar.icon}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-[0.03]"></div>
                <Clock className="h-10 w-10 text-purple-600 mr-3" />
                <div className="relative z-10">
                  <h3 className="font-medium text-purple-800">Timed Challenge</h3>
                  <p className="text-sm text-purple-600">Race against the clock for bonus XP</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg shadow-sm border border-amber-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-[0.03]"></div>
                <Trophy className="h-10 w-10 text-amber-600 mr-3" />
                <div className="relative z-10">
                  <h3 className="font-medium text-amber-800">Leaderboard Ranking</h3>
                  <p className="text-sm text-amber-600">Compete for the top spot</p>
                </div>
              </div>
            </motion.div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2 p-6 bg-gray-50 border-t border-gray-100">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleStartQuiz}
              disabled={!topics.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-6 text-lg shadow-md"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Loading...
                </>
              ) : (
                <>
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  Start Quest
                </>
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </>
  )
}
