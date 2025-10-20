
import { EventEmitter } from 'events';

interface StreamWave {
  id: string;
  origin: string;
  frequency: number;
  amplitude: number;
  phase: number;
  contentStreams: string[];
  mode: 'organize' | 'broadcast' | 'hybrid';
  active: boolean;
  timestamp: number;
}

interface LiveContent {
  id: string;
  type: 'audio' | 'video' | 'data' | 'mixed';
  source: string;
  waveId: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bandwidth: number;
  active: boolean;
  metadata: {
    title?: string;
    duration?: number;
    format?: string;
  };
}

interface OrganizationMode {
  id: string;
  name: string;
  pattern: 'sequential' | 'parallel' | 'distributed' | 'adaptive';
  priority: number;
  waveIds: string[];
}

export class WaveStreamAssemblyService extends EventEmitter {
  private static instance: WaveStreamAssemblyService;
  private streamWaves: Map<string, StreamWave> = new Map();
  private liveContent: Map<string, LiveContent> = new Map();
  private organizationModes: Map<string, OrganizationMode> = new Map();
  private assemblyInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeWaveAssembly();
  }

  static getInstance(): WaveStreamAssemblyService {
    if (!WaveStreamAssemblyService.instance) {
      WaveStreamAssemblyService.instance = new WaveStreamAssemblyService();
    }
    return WaveStreamAssemblyService.instance;
  }

  private initializeWaveAssembly() {
    console.log('🌊 Initializing Wave Stream Assembly Service...');

    // Create default wave origins
    this.createDefaultWaves();

    // Create organization modes
    this.createOrganizationModes();

    // Start assembly processing
    this.assemblyInterval = setInterval(() => {
      this.processWaveAssembly();
      this.organizeContent();
      this.optimizeWaves();
    }, 2000);

    console.log('✅ Wave Stream Assembly Service initialized');
  }

  private createDefaultWaves() {
    const waves = [
      {
        origin: 'sports-live',
        frequency: 60,
        amplitude: 100,
        mode: 'broadcast' as const
      },
      {
        origin: 'audio-stream',
        frequency: 44.1,
        amplitude: 80,
        mode: 'organize' as const
      },
      {
        origin: 'video-content',
        frequency: 30,
        amplitude: 90,
        mode: 'hybrid' as const
      },
      {
        origin: 'data-feed',
        frequency: 120,
        amplitude: 70,
        mode: 'organize' as const
      }
    ];

    waves.forEach(wave => {
      const waveId = this.createStreamWave(wave.origin, wave.frequency, wave.amplitude, wave.mode);
      console.log(`🌊 Created wave origin: ${wave.origin} (${waveId})`);
    });
  }

  private createOrganizationModes() {
    const modes = [
      {
        name: 'Sequential Assembly',
        pattern: 'sequential' as const,
        priority: 1
      },
      {
        name: 'Parallel Distribution',
        pattern: 'parallel' as const,
        priority: 2
      },
      {
        name: 'Distributed Sync',
        pattern: 'distributed' as const,
        priority: 3
      },
      {
        name: 'Adaptive Organization',
        pattern: 'adaptive' as const,
        priority: 4
      }
    ];

    modes.forEach(mode => {
      const modeId = `mode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.organizationModes.set(modeId, {
        id: modeId,
        name: mode.name,
        pattern: mode.pattern,
        priority: mode.priority,
        waveIds: []
      });
    });
  }

  createStreamWave(origin: string, frequency: number, amplitude: number, mode: 'organize' | 'broadcast' | 'hybrid'): string {
    const waveId = `wave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const wave: StreamWave = {
      id: waveId,
      origin,
      frequency,
      amplitude,
      phase: 0,
      contentStreams: [],
      mode,
      active: true,
      timestamp: Date.now()
    };

    this.streamWaves.set(waveId, wave);
    this.emit('wave:created', wave);

    return waveId;
  }

  addLiveContent(
    type: LiveContent['type'],
    source: string,
    waveId: string,
    metadata?: Partial<LiveContent['metadata']>
  ): string {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const content: LiveContent = {
      id: contentId,
      type,
      source,
      waveId,
      quality: 'high',
      bandwidth: this.calculateBandwidth(type),
      active: true,
      metadata: metadata || {}
    };

    this.liveContent.set(contentId, content);

    // Add to wave's content streams
    const wave = this.streamWaves.get(waveId);
    if (wave) {
      wave.contentStreams.push(contentId);
    }

    this.emit('content:added', content);
    console.log(`📡 Added live content: ${contentId} to wave ${waveId}`);

    return contentId;
  }

  private calculateBandwidth(type: LiveContent['type']): number {
    const bandwidthMap = {
      audio: 320, // kbps
      video: 5000, // kbps
      data: 100, // kbps
      mixed: 3000 // kbps
    };

    return bandwidthMap[type];
  }

  private processWaveAssembly() {
    for (const [waveId, wave] of this.streamWaves) {
      if (!wave.active) continue;

      // Update wave phase
      wave.phase = (wave.phase + (wave.frequency / 60)) % (2 * Math.PI);

      // Process content in wave
      wave.contentStreams.forEach(contentId => {
        const content = this.liveContent.get(contentId);
        if (content && content.active) {
          this.processContent(content, wave);
        }
      });
    }
  }

  private processContent(content: LiveContent, wave: StreamWave) {
    // Apply wave characteristics to content
    const modulation = Math.sin(wave.phase) * wave.amplitude;

    // Adjust quality based on wave modulation
    if (modulation > 75) {
      content.quality = 'ultra';
    } else if (modulation > 50) {
      content.quality = 'high';
    } else if (modulation > 25) {
      content.quality = 'medium';
    } else {
      content.quality = 'low';
    }

    this.emit('content:processed', { content, wave, modulation });
  }

  private organizeContent() {
    // Organize content using active modes
    for (const [modeId, mode] of this.organizationModes) {
      switch (mode.pattern) {
        case 'sequential':
          this.organizeSequential(mode);
          break;
        case 'parallel':
          this.organizeParallel(mode);
          break;
        case 'distributed':
          this.organizeDistributed(mode);
          break;
        case 'adaptive':
          this.organizeAdaptive(mode);
          break;
      }
    }
  }

  private organizeSequential(mode: OrganizationMode) {
    const allContent = Array.from(this.liveContent.values())
      .filter(c => c.active)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Assign to mode
    mode.waveIds = allContent
      .slice(0, 10)
      .map(c => c.waveId)
      .filter((v, i, a) => a.indexOf(v) === i);
  }

  private organizeParallel(mode: OrganizationMode) {
    const activeWaves = Array.from(this.streamWaves.values())
      .filter(w => w.active && w.mode === 'broadcast');

    mode.waveIds = activeWaves.map(w => w.id);
  }

  private organizeDistributed(mode: OrganizationMode) {
    const waves = Array.from(this.streamWaves.values())
      .filter(w => w.active)
      .sort((a, b) => b.contentStreams.length - a.contentStreams.length);

    mode.waveIds = waves.slice(0, 5).map(w => w.id);
  }

  private organizeAdaptive(mode: OrganizationMode) {
    const activeContent = Array.from(this.liveContent.values()).filter(c => c.active);
    const contentByWave = new Map<string, number>();

    activeContent.forEach(content => {
      contentByWave.set(content.waveId, (contentByWave.get(content.waveId) || 0) + 1);
    });

    mode.waveIds = Array.from(contentByWave.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([waveId]) => waveId);
  }

  private optimizeWaves() {
    for (const [waveId, wave] of this.streamWaves) {
      // Remove inactive content
      wave.contentStreams = wave.contentStreams.filter(contentId => {
        const content = this.liveContent.get(contentId);
        return content && content.active;
      });

      // Deactivate empty waves
      if (wave.contentStreams.length === 0 && wave.active) {
        wave.active = false;
        console.log(`⏸️ Deactivated empty wave: ${waveId}`);
      }

      // Optimize frequency based on content load
      if (wave.contentStreams.length > 10) {
        wave.frequency = Math.min(wave.frequency * 1.2, 120);
      }
    }
  }

  assembleActiveStreams(): {
    totalWaves: number;
    activeWaves: number;
    totalContent: number;
    activeContent: number;
    organizationModes: number;
    assembly: any[];
  } {
    const activeWaves = Array.from(this.streamWaves.values()).filter(w => w.active);
    const activeContent = Array.from(this.liveContent.values()).filter(c => c.active);

    const assembly = activeWaves.map(wave => {
      const waveContent = wave.contentStreams
        .map(id => this.liveContent.get(id))
        .filter(c => c && c.active);

      return {
        waveId: wave.id,
        origin: wave.origin,
        frequency: wave.frequency,
        amplitude: wave.amplitude,
        mode: wave.mode,
        contentCount: waveContent.length,
        totalBandwidth: waveContent.reduce((sum, c) => sum + (c?.bandwidth || 0), 0),
        content: waveContent.map(c => ({
          id: c!.id,
          type: c!.type,
          quality: c!.quality,
          source: c!.source
        }))
      };
    });

    return {
      totalWaves: this.streamWaves.size,
      activeWaves: activeWaves.length,
      totalContent: this.liveContent.size,
      activeContent: activeContent.length,
      organizationModes: this.organizationModes.size,
      assembly
    };
  }

  getWaveStatus() {
    return {
      waves: Array.from(this.streamWaves.values()),
      content: Array.from(this.liveContent.values()),
      modes: Array.from(this.organizationModes.values()),
      fccEntity: '20130314143016'
    };
  }

  shutdown() {
    if (this.assemblyInterval) {
      clearInterval(this.assemblyInterval);
    }
    console.log('🛑 Wave Stream Assembly Service shutdown');
  }
}

export const waveStreamAssemblyService = WaveStreamAssemblyService.getInstance();
