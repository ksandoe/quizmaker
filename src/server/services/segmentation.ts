import { supabase } from '../utils/database';
import type { NewSegment } from '../../utils/supabase';
import { generateQuestionForSegment } from './questions';

const WORDS_PER_SEGMENT = 900;

interface SegmentationResult {
  segments: NewSegment[];
  totalSegments: number;
}

export async function createSegments(videoId: string, transcript: string): Promise<SegmentationResult> {
  try {
    // Verify video exists first and get max_segments
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('video_id, max_segments')
      .eq('video_id', videoId)
      .single();

    if (videoError || !video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    // Split transcript into words
    const words = transcript.split(/\s+/);
    const totalWords = words.length;
    
    // Use max_segments from video if set, otherwise calculate based on WORDS_PER_SEGMENT
    const totalSegments = video.max_segments || Math.ceil(totalWords / WORDS_PER_SEGMENT);
    const wordsPerSegment = Math.ceil(totalWords / totalSegments);

    console.log('Creating segments:', {
      totalWords,
      totalSegments,
      wordsPerSegment,
      videoId
    });

    const segments: NewSegment[] = [];
    
    // Create segments of roughly equal size
    for (let i = 0; i < totalSegments; i++) {
      const start = i * wordsPerSegment;
      const end = Math.min(start + wordsPerSegment, totalWords);
      const content = words.slice(start, end).join(' ');
      const wordCount = content.split(/\s+/).length;

      console.log(`Creating segment ${i + 1}/${totalSegments}`, {
        wordCount,
        contentLength: content.length
      });

      segments.push({
        video_id: videoId,
        content,
        creator_id: '', // Will be set in storeSegments
        status: 'pending',
        word_count: wordCount
      });
    }

    return { segments, totalSegments };
  } catch (error) {
    console.error('Error creating segments:', error);
    throw error;
  }
}

export async function storeSegments(segments: NewSegment[], creatorId: string): Promise<void> {
  if (!segments.length) {
    throw new Error('No segments to store');
  }

  const videoId = segments[0].video_id;

  try {
    // Verify video exists and belongs to creator
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('video_id')
      .eq('video_id', videoId)
      .eq('creator_id', creatorId)
      .single();

    if (videoError || !video) {
      throw new Error(`Video not found or access denied: ${videoId}`);
    }

    console.log('Storing segments:', {
      count: segments.length,
      videoId,
      creatorId
    });

    // Add creator_id to each segment and ensure required fields
    const segmentsWithCreator = segments.map((segment, index) => {
      // Validate required fields
      if (!segment.content) {
        throw new Error('Segment content is required');
      }
      if (!segment.video_id) {
        throw new Error('Segment video_id is required');
      }
      if (!creatorId) {
        throw new Error('Creator ID is required');
      }

      return {
        content: segment.content,
        video_id: segment.video_id,
        creator_id: creatorId,
        status: 'pending' as const,
        word_count: segment.word_count
      };
    });

    // Log segment data before insert
    console.log('Segment data:', segmentsWithCreator.map((s, index) => ({
      video_id: s.video_id,
      content_length: s.content.length,
      word_count: s.word_count,
      creator_id: s.creator_id,
      status: s.status,
      position: index + 1
    })));

    // Batch insert segments
    const { error, data: storedSegments } = await supabase
      .from('segments')
      .insert(segmentsWithCreator)
      .select();

    if (error) {
      console.error('Error storing segments:', error);
      throw new Error(`Database error storing segments: ${error.message}`);
    }

    if (!storedSegments) {
      throw new Error('No segments were stored');
    }

    console.log('Successfully stored segments:', storedSegments);

    // Start question generation for each segment
    console.log('Starting question generation for segments');
    for (const segment of storedSegments) {
      try {
        console.log(`Generating question for segment ${segment.segment_id}`);
        await generateQuestionForSegment(segment.segment_id, segment.content, creatorId);
        console.log(`Successfully generated question for segment ${segment.segment_id}`);
      } catch (error) {
        console.error(`Error generating question for segment ${segment.segment_id}:`, error);
        // Continue with other segments even if one fails
      }
    }

    // Update video status
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'segmented',
        updated_at: new Date().toISOString(),
      })
      .eq('video_id', videoId)
      .eq('creator_id', creatorId);

    if (updateError) {
      console.error('Error updating video status:', updateError);
      throw new Error(`Database error updating video: ${updateError.message}`);
    }

    console.log('Successfully updated video status to segmented');

  } catch (error) {
    console.error('Error in storeSegments:', error);

    // Update video status to error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error storing segments';
    
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'error',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('video_id', videoId)
      .eq('creator_id', creatorId);

    if (updateError) {
      console.error('Error updating video error status:', updateError);
    }

    throw error;
  }
}
