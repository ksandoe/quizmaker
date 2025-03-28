-- First, ensure tables exist
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  transcript TEXT,
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS segments (
  id SERIAL PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  start_time INTEGER,
  end_time INTEGER,
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- First, drop all existing RLS policies
DROP POLICY IF EXISTS "Public videos are viewable by everyone" ON videos;
DROP POLICY IF EXISTS "Public segments are viewable by everyone" ON segments;
DROP POLICY IF EXISTS "Public questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Public responses are viewable by everyone" ON responses;
DROP POLICY IF EXISTS "Authenticated users can create videos" ON videos;
DROP POLICY IF EXISTS "Users can view their own videos" ON videos;
DROP POLICY IF EXISTS "Users can create their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;
DROP POLICY IF EXISTS "Service role has full access to videos" ON videos;
DROP POLICY IF EXISTS "Service role has full access to segments" ON segments;
DROP POLICY IF EXISTS "Service role has full access to questions" ON questions;
DROP POLICY IF EXISTS "Service role has full access to responses" ON responses;

-- Enable RLS on all tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON videos TO service_role;
GRANT ALL ON segments TO service_role;
GRANT ALL ON questions TO service_role;
GRANT ALL ON responses TO service_role;

-- Create policies for videos table
CREATE POLICY "Users can view their own videos"
ON videos FOR SELECT
USING (auth.uid()::text = creator_id);

CREATE POLICY "Users can create their own videos"
ON videos FOR INSERT
WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own videos"
ON videos FOR UPDATE
USING (auth.uid()::text = creator_id);

CREATE POLICY "Service role has full access to videos"
ON videos FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for segments table
CREATE POLICY "Users can view their own segments"
ON segments FOR SELECT
USING (auth.uid()::text = creator_id);

CREATE POLICY "Users can create their own segments"
ON segments FOR INSERT
WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own segments"
ON segments FOR UPDATE
USING (auth.uid()::text = creator_id);

CREATE POLICY "Service role has full access to segments"
ON segments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for questions table
CREATE POLICY "Users can view their own questions"
ON questions FOR SELECT
USING (auth.uid()::text = creator_id);

CREATE POLICY "Users can create their own questions"
ON questions FOR INSERT
WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own questions"
ON questions FOR UPDATE
USING (auth.uid()::text = creator_id);

CREATE POLICY "Service role has full access to questions"
ON questions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for responses table
CREATE POLICY "Users can view their own responses"
ON responses FOR SELECT
USING (auth.uid()::text = creator_id);

CREATE POLICY "Users can create their own responses"
ON responses FOR INSERT
WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own responses"
ON responses FOR UPDATE
USING (auth.uid()::text = creator_id);

CREATE POLICY "Service role has full access to responses"
ON responses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
