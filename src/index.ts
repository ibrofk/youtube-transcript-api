import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { VideoManagement } from './functions/videos';

// Environment variable validation
if (!process.env.YOUTUBE_API_KEY) {
  console.error('Error: YOUTUBE_API_KEY environment variable is not set.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create video manager instance
const videoManager = new VideoManagement();

// Helper function to extract YouTube video ID from URL
function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

// API endpoint to get transcript by URL
app.post('/api/transcript', async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Add logging
    const { url, lang } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const videoId = extractVideoId(url);

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const transcriptItems = await videoManager.getTranscript(videoId, lang);

    // Concatenate the text from transcript items
    const fullTranscript = transcriptItems.map(item => item.text).join(' ');

    return res.json({
      videoId,
      transcript: fullTranscript // Return the concatenated string
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to retrieve transcript',
      message: error.message
    });
  }
});

// API endpoint to get transcript by video ID
app.post('/api/transcript/id', async (req, res) => {
  try {
    const { videoId, lang } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    const transcriptItems = await videoManager.getTranscript(videoId, lang);

    // Concatenate the text from transcript items
    const fullTranscript = transcriptItems.map(item => item.text).join(' ');

    return res.json({
      videoId,
      transcript: fullTranscript // Return the concatenated string
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to retrieve transcript',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server only if not in a Vercel environment
// Vercel provides its own server environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`YouTube Transcript API server running on port ${port}`);
  });
}

// Export the Express app instance for Vercel
export default app;