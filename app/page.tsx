"use client"

import QuizSetup from "@/components/quiz-setup"
import { DbStatus } from "@/components/db-status"
import { Gamepad2, Trophy, Zap, Star, Brain, Target } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
      <style jsx>{`
    .pattern-fallback {
      background-color: rgba(124, 58, 237, 0.03);
      background-image: 
        radial-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px),
        radial-gradient(rgba(124, 58, 237, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
      background-position: 0 0, 10px 10px;
    }
  `}</style>
      {/* Background elements with fallback */}
      <div className="absolute inset-0 pattern-fallback bg-[url('/patterns/grid.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none"></div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full bg-purple-500/10 pointer-events-none"
        animate={{
          y: [0, -20, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-16 h-16 rounded-full bg-indigo-500/10 pointer-events-none"
        animate={{
          y: [0, 30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 7,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 w-8 h-8 rounded-full bg-blue-500/10 pointer-events-none"
        animate={{
          y: [0, -15, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full mb-6 shadow-lg"
          >
            <Gamepad2 className="h-6 w-6 inline-block mr-2" />
            <span className="font-bold text-xl">Code Quest</span>
          </motion.div>

          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-indigo-700 mb-6"
          >
            Test Your Coding Knowledge
          </motion.h1>

          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-purple-600 max-w-2xl mx-auto"
          >
            Challenge yourself with coding quizzes, earn XP, and climb the leaderboard!
          </motion.p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center bg-gradient-to-r from-purple-100 to-purple-200 px-5 py-3 rounded-full text-purple-800 shadow-sm border border-purple-200"
            >
              <Zap className="h-5 w-5 mr-2 text-purple-600" />
              <span className="font-medium">Earn XP</span>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center bg-gradient-to-r from-blue-100 to-blue-200 px-5 py-3 rounded-full text-blue-800 shadow-sm border border-blue-200"
            >
              <Star className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium">Level Up</span>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href="/leaderboard"
                className="flex items-center bg-gradient-to-r from-amber-100 to-amber-200 px-5 py-3 rounded-full text-amber-800 shadow-sm border border-amber-200"
              >
                <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                <span className="font-medium">Compete</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Feature cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/patterns/circuit.png')] opacity-[0.03]"></div>
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-purple-800 mb-2">Knowledge Challenge</h3>
            <p className="text-purple-600">Test your coding knowledge with questions tailored to your skill level.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/patterns/dots.png')] opacity-[0.03]"></div>
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">Skill Progression</h3>
            <p className="text-blue-600">Earn XP, unlock achievements, and level up as you improve your skills.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/patterns/hexagons.png')] opacity-[0.03]"></div>
            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-amber-800 mb-2">Global Leaderboard</h3>
            <p className="text-amber-600">Compete with others and see how you rank on our global leaderboard.</p>
          </div>
        </motion.div>

        <div className="mb-6">
          <DbStatus />
        </div>

        <QuizSetup />
      </div>
    </main>
  )
}
