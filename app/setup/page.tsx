import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, FileText, ArrowLeft } from "lucide-react"

export default function SetupPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-purple-100">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">Database Setup</h1>
            <p className="text-purple-600">Set up your database for the quiz app</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Quiz
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Database Setup Instructions
              </CardTitle>
              <CardDescription>Follow these steps to set up the database tables for the quiz app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-purple-800 mb-2">Current Status</h3>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-amber-800">
                      The app is currently using file-based storage because the required database tables don't exist.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-purple-800 mb-2">Option 1: Continue with File Storage</h3>
                  <div className="p-4 bg-blue-50 rounded-lg flex items-start">
                    <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-800">
                        You can continue using the app with file-based storage. Your scores will be saved locally and
                        will only be visible to you.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-purple-800 mb-2">Option 2: Set Up Database Tables</h3>
                  <div className="p-4 bg-green-50 rounded-lg flex items-start">
                    <Database className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-800 mb-2">
                        To use database storage, you need to create the required tables in your Supabase project:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-green-800">
                        <li>Go to your Supabase project dashboard</li>
                        <li>Navigate to the SQL Editor</li>
                        <li>Create a new query</li>
                        <li>Copy and paste the SQL below</li>
                        <li>Run the query</li>
                      </ol>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-900 rounded-lg text-gray-100 font-mono text-sm overflow-x-auto">
                    <pre>{`-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  difficulty TEXT NOT NULL,
  xp_points INTEGER NOT NULL,
  time_in_seconds INTEGER NOT NULL,
  questions_count INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  id,
  username,
  topics,
  difficulty,
  xp_points,
  time_in_seconds,
  questions_count,
  correct_answers,
  created_at,
  ROUND(
    (xp_points::FLOAT / GREATEST(time_in_seconds::FLOAT / 60, 0.1)) * 
    CASE 
      WHEN difficulty = 'beginner' THEN 1
      WHEN difficulty = 'intermediate' THEN 1.5
      ELSE 2
    END,
    2
  ) AS efficiency,
  ROW_NUMBER() OVER (
    ORDER BY 
      (xp_points::FLOAT / GREATEST(time_in_seconds::FLOAT / 60, 0.1)) * 
      CASE 
        WHEN difficulty = 'beginner' THEN 1
        WHEN difficulty = 'intermediate' THEN 1.5
        ELSE 2
      END DESC
  ) AS rank
FROM quiz_results;`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full">
                <Link href="/">
                  <Button variant="outline">Back to Quiz</Button>
                </Link>
                <Link href="/leaderboard">
                  <Button className="bg-purple-700 hover:bg-purple-800">View Leaderboard</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  )
}
