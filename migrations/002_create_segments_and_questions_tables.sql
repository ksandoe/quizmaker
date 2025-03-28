-- Create segments table
CREATE TABLE IF NOT EXISTS public.segments (
    id BIGSERIAL PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    start_time INTEGER,
    end_time INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for segments
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon and authenticated users
CREATE POLICY "Allow all operations" ON public.segments
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Create segments updated_at trigger
CREATE TRIGGER handle_segments_updated_at
    BEFORE UPDATE ON public.segments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id BIGSERIAL PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon and authenticated users
CREATE POLICY "Allow all operations" ON public.questions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Create questions updated_at trigger
CREATE TRIGGER handle_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create responses table
CREATE TABLE IF NOT EXISTS public.responses (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for responses
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon and authenticated users
CREATE POLICY "Allow all operations" ON public.responses
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
