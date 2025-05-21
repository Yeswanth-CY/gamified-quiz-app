-- This file is for reference only. You need to run these commands in the Supabase SQL editor.

-- Create quiz_results table
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
FROM quiz_results;
