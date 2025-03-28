-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  video_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  transcript TEXT,
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  duration_seconds INTEGER,
  word_count INTEGER,
  max_segments INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create segments table
CREATE TABLE IF NOT EXISTS segments (
  segment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  question_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES segments(segment_id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  response_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  creator_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Videos policies
CREATE POLICY "Users can view their own videos" ON videos
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own videos" ON videos
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE USING (auth.uid() = creator_id);

-- Segments policies
CREATE POLICY "Users can view segments of their videos" ON segments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM videos WHERE videos.video_id = segments.video_id AND videos.creator_id = auth.uid()
  ));

CREATE POLICY "Users can create segments for their videos" ON segments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM videos WHERE videos.video_id = segments.video_id AND videos.creator_id = auth.uid()
  ));

CREATE POLICY "Users can update segments of their videos" ON segments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM videos WHERE videos.video_id = segments.video_id AND videos.creator_id = auth.uid()
  ));

CREATE POLICY "Users can delete segments of their videos" ON segments
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM videos WHERE videos.video_id = segments.video_id AND videos.creator_id = auth.uid()
  ));

-- Questions policies
CREATE POLICY "Users can view questions of their segments" ON questions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM segments 
    JOIN videos ON segments.video_id = videos.video_id 
    WHERE segments.segment_id = questions.segment_id AND videos.creator_id = auth.uid()
  ));

CREATE POLICY "Users can create questions for their segments" ON questions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM segments 
    JOIN videos ON segments.video_id = videos.video_id 
    WHERE segments.segment_id = questions.segment_id AND videos.creator_id = auth.uid()
  ));

CREATE POLICY "Users can update questions of their segments" ON questions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM segments 
    JOIN videos ON segments.video_id = videos.video_id 
    WHERE segments.segment_id = questions.segment_id AND videos.creator_id = auth.uid()
  ));

CREATE POLICY "Users can delete questions of their segments" ON questions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM segments 
    JOIN videos ON segments.video_id = videos.video_id 
    WHERE segments.segment_id = questions.segment_id AND videos.creator_id = auth.uid()
  ));

-- Responses policies
CREATE POLICY "Users can view their own responses" ON responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own responses" ON responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses" ON responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses" ON responses
  FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
