import { google, youtube_v3 } from 'googleapis';
import { getSubtitles } from 'youtube-captions-scraper';

export interface VideoOptions {
  videoId: string;
  parts?: string[];
}

export class VideoManagement {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }

  async getVideo({ videoId, parts = ['snippet'] }: VideoOptions) {
    try {
      const response = await this.youtube.videos.list({
        part: parts,
        id: [videoId]
      });

      if (!response.data.items?.length) {
        throw new Error('Video not found.');
      }

      return response.data.items[0];
    } catch (error: any) {
      throw new Error(`Failed to retrieve video information: ${error.message}`);
    }
  }

  async getTranscript(videoId: string, lang?: string) {
    try {
      const transcript = await getSubtitles({
        videoID: videoId,
        lang: lang || process.env.YOUTUBE_TRANSCRIPT_LANG || 'en'
      });
      return transcript;
    } catch (error: any) {
      throw new Error(`Failed to retrieve transcript: ${error.message}`);
    }
  }
}