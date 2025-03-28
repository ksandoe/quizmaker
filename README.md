# QuizMaker

A React application that helps create quizzes from YouTube videos by segmenting their transcripts.

## Features

- YouTube video URL validation
- Video duration validation (5-45 minutes)
- Transcript segmentation
- Supabase integration for data storage

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- YouTube Data API key
- Supabase account and project

## Binary Dependencies

This project requires the following binary dependencies:

1. yt-dlp.exe - For downloading YouTube videos
2. ffmpeg - For audio processing

### Setup Instructions

1. Create a `bin` directory in the project root
2. Download the latest version of [yt-dlp](https://github.com/yt-dlp/yt-dlp/releases) and place it in the `bin` directory as `yt-dlp.exe`
3. Download [ffmpeg](https://ffmpeg.org/download.html) and place the following files in the `bin` directory:
   - ffmpeg.exe
   - ffplay.exe
   - ffprobe.exe

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables file:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to the `.env` file:
   ```
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. Create the following table in your Supabase database:
   ```sql
   create table video_segments (
     id uuid default uuid_generate_v4() primary key,
     video_title text not null,
     video_duration integer not null,
     segment_count integer not null,
     segments text[] not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Enter a YouTube video URL
2. The application will validate the video length (must be between 5-45 minutes)
3. Choose the number of segments (minimum 1, maximum is video length divided by 3)
4. The application will divide the transcript into roughly equal segments
5. Segments will be stored in the Supabase database

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- YouTube Data API
- Supabase
