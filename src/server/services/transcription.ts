import { supabase } from '../utils/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { createSegments, storeSegments } from './segmentation';

const execAsync = promisify(exec);
const YTDLP_PATH = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = path.join(process.cwd(), 'bin');

async function updateVideoStatus(videoId: string, status: string, errorMessage?: string) {
  console.log('Updating video status:', { videoId, status, errorMessage });
  const { error } = await supabase
    .from('videos')
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('video_id', videoId);

  if (error) {
    console.error('Error updating video status:', error);
  }
}

async function downloadAudio(url: string, outputPath: string): Promise<string> {
  // First, get video info to verify it's available
  const infoCommand = `${YTDLP_PATH} --print title --no-download ${url}`;
  console.log('Running info command:', infoCommand);
  const { stdout: videoTitle } = await execAsync(infoCommand);
  const title = videoTitle.trim();
  console.log('Video title:', title);

  // Download and extract audio
  const command = `${YTDLP_PATH} -x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${FFMPEG_PATH}" -o "${outputPath}" ${url}`;
  console.log('Running download command:', command);
  const { stdout, stderr } = await execAsync(command);
  
  if (stderr) {
    console.warn('yt-dlp stderr:', stderr);
  }
  
  console.log('yt-dlp stdout:', stdout);
  
  // Verify the file exists and has content
  const stats = await fs.promises.stat(outputPath);
  if (stats.size === 0) {
    throw new Error('Downloaded audio file is empty');
  }
  
  console.log('Audio file stats:', {
    size: stats.size,
    path: outputPath,
    exists: true
  });

  return title;
}

async function transcribeAudio(audioPath: string): Promise<{ text: string; wordCount: number }> {
  // Read audio file
  const audioFile = await fs.promises.readFile(audioPath);
  const fileSizeInMB = audioFile.length / (1024 * 1024);
  console.log('Audio file size:', {
    bytes: audioFile.length,
    megabytes: fileSizeInMB.toFixed(2) + 'MB'
  });

  if (fileSizeInMB > 25) {
    throw new Error('Audio file too large. Must be under 25MB');
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', Buffer.from(audioFile), {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg'
  });
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  // Send request to OpenAI with timeout
  console.log('Sending audio to OpenAI for transcription');
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 5 * 60 * 1000); // 5 minute timeout

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json();
      if (error.error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing details or try again later.');
      }
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const text = result.text.trim();
    const wordCount = text.split(/\s+/).length;

    return { text, wordCount };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Transcription timed out after 5 minutes');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function transcribeVideo(url: string, videoId: string, creatorId: string): Promise<void> {
  let tempDir = '';
  let title = '';

  try {
    // Create temporary directory
    tempDir = path.join(process.cwd(), 'temp', videoId);
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await fs.promises.mkdir(tempDir, { recursive: true });
    console.log('Created temp directory:', tempDir);

    // Download audio
    await updateVideoStatus(videoId, 'downloading');
    const audioPath = path.join(tempDir, 'audio.mp3');
    try {
      title = await downloadAudio(url, audioPath);
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Transcribe audio
    await updateVideoStatus(videoId, 'transcribing');
    let transcription;
    try {
      transcription = await transcribeAudio(audioPath);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create segments
    console.log('Creating segments from transcript');
    let segments;
    let totalSegments;
    try {
      const result = await createSegments(videoId, transcription.text);
      segments = result.segments;
      totalSegments = result.totalSegments;
      console.log(`Created ${segments.length} segments out of ${totalSegments} total`);
    } catch (error) {
      console.error('Error creating segments:', error);
      throw new Error(`Failed to create segments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update video record
    console.log('Updating video record with transcript and metadata');
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        title,
        transcript: transcription.text,
        status: 'processing',
        word_count: transcription.wordCount,
        max_segments: totalSegments,
        updated_at: new Date().toISOString(),
      })
      .eq('video_id', videoId);

    if (updateError) {
      throw new Error(`Failed to update video record: ${updateError.message}`);
    }

    // Store segments
    console.log('Storing segments in database');
    try {
      await storeSegments(segments, creatorId);
    } catch (error) {
      console.error('Error storing segments:', error);
      throw new Error(`Failed to store segments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Update final status
    await updateVideoStatus(videoId, 'completed');
    console.log('Video processing completed successfully');

  } catch (error) {
    console.error('Error in transcription process:', error);
    await updateVideoStatus(
      videoId,
      'error',
      error instanceof Error ? error.message : 'Unknown transcription error'
    );
    throw error;
  } finally {
    // Clean up temp directory
    if (tempDir) {
      fs.promises.rm(tempDir, { recursive: true, force: true }).catch((error) => {
        console.error('Error cleaning up temp directory:', error);
      });
    }
  }
}
