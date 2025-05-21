"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Gamepad2, Trophy, Clock } from "lucide-react"

export default function QuizSetup() {
  const router = useRouter()
  const [topics, setTopics] = useState("")
  const [difficulty, setDifficulty] = useState("beginner")
  const [questionCount, setQuestionCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)

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
    <Card className="w-full shadow-lg border-purple-200">
      <CardHeader className="bg-purple-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Gamepad2 className="h-6 w-6" />
          Quiz Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topics">Topics (comma separated)</Label>
            <Input
              id="topics"
              placeholder="e.g. Python, Java, SQL"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="border-purple-200 focus:border-purple-400"
            />
            <p className="text-sm text-gray-500">Enter programming languages or topics separated by commas</p>
          </div>

          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <RadioGroup
              value={difficulty}
              onValueChange={setDifficulty}
              className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="cursor-pointer">
                  Beginner
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="cursor-pointer">
                  Intermediate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="cursor-pointer">
                  Advanced
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Number of Questions: {questionCount}</Label>
            </div>
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
              <span>10</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <h3 className="font-medium text-sm">Timed Challenge</h3>
                <p className="text-xs text-gray-500">Race against the clock for bonus XP</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Trophy className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <h3 className="font-medium text-sm">Leaderboard Ranking</h3>
                <p className="text-xs text-gray-500">Compete for the top spot</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        <Button
          onClick={handleStartQuiz}
          disabled={!topics.trim() || isLoading}
          className="bg-purple-700 hover:bg-purple-800"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Loading...
            </>
          ) : (
            "Start Quiz"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
