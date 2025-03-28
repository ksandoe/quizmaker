import { Router, Request, Response, NextFunction } from 'express';
import { transcribeVideo } from '../services/transcription';
import { supabase } from '../utils/database';

const router = Router();

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Middleware
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  console.log('Auth header length:', authHeader ? authHeader.length : 0);
  
  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header' });
    return;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);

    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('Auth result:', { userId: user?.id, hasError: !!error });

    if (error || !user) {
      console.error('Auth error:', error);
      res.status(401).json({ error: error?.message || 'Unauthorized' });
      return;
    }

    req.user = { id: user.id };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
};

// POST /api/transcript/transcribe
const transcribeHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('Received transcribe request:', { body: req.body, user: req.user });
  
  const { url } = req.body;
  const creator_id = req.user?.id;

  if (!url) {
    res.status(400).json({ error: 'Missing URL' });
    return;
  }

  if (!creator_id) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Validate it's a YouTube URL
    if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
      res.status(400).json({ error: 'Only YouTube URLs are supported' });
      return;
    }

    console.log('Creating video record for URL:', url);

    // Create video record
    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert([{
        url,
        creator_id,
        status: 'pending',
        title: url, // Temporary title, will be updated during processing
        max_segments: 3, // Set default max segments
      }])
      .select('*')
      .single();

    if (dbError) {
      console.error('Database error creating video:', dbError);
      res.status(500).json({ error: 'Failed to create video record: ' + dbError.message });
      return;
    }

    if (!video?.video_id) {
      console.error('No video ID returned from database');
      res.status(500).json({ error: 'Failed to create video record: no ID returned' });
      return;
    }

    console.log('Starting transcription for video:', { video_id: video.video_id, url });

    // Start transcription process
    transcribeVideo(url, video.video_id, creator_id).catch((error) => {
      console.error('Error in transcription process:', error);
      supabase
        .from('videos')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown transcription error',
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', video.video_id)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error('Error updating video status:', updateError);
          }
        });
    });

    res.status(200).json({ video });
  } catch (error) {
    console.error('Error in transcribe handler:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// GET /api/transcript/status/:video_id
const statusHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('Received status request:', { params: req.params, user: req.user });
  
  const { video_id } = req.params;
  const creator_id = req.user?.id;

  if (!video_id) {
    res.status(400).json({ error: 'Missing video ID' });
    return;
  }

  if (!creator_id) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    console.log('Fetching video status:', { video_id, creator_id });

    const { data: video, error } = await supabase
      .from('videos')
      .select('status, error_message, title, word_count, max_segments')
      .eq('video_id', video_id)
      .eq('creator_id', creator_id)
      .single();

    if (error) {
      console.error('Database error getting video status:', error);
      res.status(500).json({ error: 'Failed to get video status: ' + error.message });
      return;
    }

    if (!video) {
      console.log('Video not found:', { video_id, creator_id });
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    console.log('Video status:', video);
    res.json({ data: video });
  } catch (error) {
    console.error('Error in status handler:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Routes
router.post('/transcribe', requireAuth, transcribeHandler);
router.get('/status/:video_id', requireAuth, statusHandler);

export default router;
