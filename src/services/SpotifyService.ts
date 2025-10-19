
import { EventEmitter } from 'events';
import { contentControlService } from './ContentControlService.js';
import { SSOUser } from './SSOService.js';

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  previewUrl?: string;
  imageUrl?: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  tracks: SpotifyTrack[];
}

interface SpotifyUpload {
  id: string;
  userId: string;
  spotifyId: string;
  type: 'track' | 'playlist' | 'album';
  name: string;
  uploadedAt: string;
  contentId: string;
  metadata: any;
}

class SpotifyService extends EventEmitter {
  private uploads: Map<string, SpotifyUpload> = new Map();
  private userConnections: Map<string, {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }> = new Map();

  // Connect Spotify account
  connectSpotify(userId: string, accessToken: string, refreshToken: string, expiresIn: number): void {
    this.userConnections.set(userId, {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000)
    });
    
    this.emit('spotifyConnected', { userId });
  }

  // Check if user has connected Spotify
  isConnected(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  // Upload Spotify content to server
  uploadContent(
    user: SSOUser,
    spotifyData: {
      id: string;
      type: 'track' | 'playlist' | 'album';
      name: string;
      metadata: any;
    }
  ): { success: boolean; upload?: SpotifyUpload; error?: string } {
    if (!this.isConnected(user.id)) {
      return { success: false, error: 'Spotify account not connected' };
    }

    // Create content item in content control system
    const content = contentControlService.createContent(user, {
      title: `Spotify ${spotifyData.type}: ${spotifyData.name}`,
      type: 'media',
      accessLevel: 'private',
      metadata: {
        ...spotifyData.metadata,
        spotifyId: spotifyData.id,
        spotifyType: spotifyData.type,
        source: 'spotify'
      }
    });

    // Create upload record
    const uploadId = `spotify_upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const upload: SpotifyUpload = {
      id: uploadId,
      userId: user.id,
      spotifyId: spotifyData.id,
      type: spotifyData.type,
      name: spotifyData.name,
      uploadedAt: new Date().toISOString(),
      contentId: content.id,
      metadata: spotifyData.metadata
    };

    this.uploads.set(uploadId, upload);
    this.emit('contentUploaded', upload);

    return { success: true, upload };
  }

  // Get user's Spotify uploads
  getUserUploads(userId: string): SpotifyUpload[] {
    return Array.from(this.uploads.values())
      .filter(upload => upload.userId === userId);
  }

  // Get upload by ID
  getUpload(uploadId: string): SpotifyUpload | undefined {
    return this.uploads.get(uploadId);
  }

  // Delete upload
  deleteUpload(userId: string, uploadId: string): boolean {
    const upload = this.uploads.get(uploadId);
    if (!upload || upload.userId !== userId) {
      return false;
    }

    this.uploads.delete(uploadId);
    this.emit('uploadDeleted', { uploadId, userId });
    return true;
  }

  // Simulate fetching Spotify data (in production, use Spotify API)
  async fetchSpotifyData(userId: string, spotifyId: string, type: 'track' | 'playlist' | 'album'): Promise<any> {
    const connection = this.userConnections.get(userId);
    if (!connection) {
      throw new Error('Spotify not connected');
    }

    // Mock data - replace with actual Spotify API calls
    if (type === 'track') {
      return {
        id: spotifyId,
        name: 'Sample Track',
        artist: 'Sample Artist',
        album: 'Sample Album',
        duration: 240000,
        previewUrl: 'https://example.com/preview.mp3',
        imageUrl: 'https://example.com/artwork.jpg'
      };
    }

    return {
      id: spotifyId,
      name: 'Sample Playlist',
      description: 'My playlist',
      trackCount: 10,
      tracks: []
    };
  }
}

export const spotifyService = new SpotifyService();
