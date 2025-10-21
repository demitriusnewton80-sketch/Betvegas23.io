
interface StreamingPartner {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export class StreamingService {
  private static instance: StreamingService;
  private partners: StreamingPartner[] = [
    { id: 'partner-1', name: 'ESPN Sportsbook', type: 'video', active: true },
    { id: 'partner-2', name: 'Unified Sports Hub', type: 'video', active: true },
    { id: 'partner-3', name: 'Enhanced Sportsbook', type: 'video', active: true },
    { id: 'partner-4', name: 'Mobile Sportsbook Hub', type: 'mobile', active: true },
    { id: 'partner-5', name: 'PS5 Betting', type: 'console', active: false },
    { id: 'partner-6', name: 'Boxing & UFC Hub', type: 'video', active: false }
  ];

  static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  getStreamingPartners(): StreamingPartner[] {
    return this.partners;
  }
}

export const streamingService = StreamingService.getInstance();
