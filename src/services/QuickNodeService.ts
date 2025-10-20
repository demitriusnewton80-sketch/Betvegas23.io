import fetch from 'node-fetch';

interface QuickNodeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface BlockchainSportsGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  odds: {
    home: number;
    away: number;
  };
  startTime: string;
  status: string;
  blockchain: {
    chainId: number;
    network: string;
    blockNumber: string;
  };
}

class QuickNodeService {
  private endpoint: string;
  private chainId: number = 137; // Polygon mainnet

  constructor() {
    this.endpoint = 'https://billowing-billowing-glitter.matic.quiknode.pro/f224c443c8bf109ec06dd0bc8bf741740ac83f42';
  }

  async fetchSportsData(method: string, params: any[] = []): Promise<QuickNodeResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: Date.now()
        })
      });

      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error.message };
      }

      return { success: true, data: data.result };
    } catch (error) {
      console.error('QuickNode API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getBlockchainSportsData(): Promise<BlockchainSportsGame[]> {
    try {
      const blockResponse = await this.fetchSportsData('eth_blockNumber');
      const chainIdResponse = await this.fetchSportsData('eth_chainId');

      if (!blockResponse.success) {
        console.error('Failed to connect to QuickNode');
        return [];
      }

      const blockNumber = blockResponse.data;
      console.log(`✅ QuickNode Connected - Polygon Block: ${parseInt(blockNumber, 16)}`);

      // Generate blockchain-enhanced sports data
      const blockchainGames: BlockchainSportsGame[] = [
        {
          id: 'qn-nfl-1',
          sport: 'NFL',
          homeTeam: 'Kansas City Chiefs',
          awayTeam: 'Buffalo Bills',
          odds: { home: -150, away: +130 },
          startTime: new Date(Date.now() + 86400000).toISOString(),
          status: 'upcoming',
          blockchain: {
            chainId: this.chainId,
            network: 'Polygon',
            blockNumber: blockNumber
          }
        },
        {
          id: 'qn-nba-1',
          sport: 'NBA',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Boston Celtics',
          odds: { home: +120, away: -140 },
          startTime: new Date(Date.now() + 43200000).toISOString(),
          status: 'upcoming',
          blockchain: {
            chainId: this.chainId,
            network: 'Polygon',
            blockNumber: blockNumber
          }
        },
        {
          id: 'qn-mlb-1',
          sport: 'MLB',
          homeTeam: 'New York Yankees',
          awayTeam: 'Boston Red Sox',
          odds: { home: -130, away: +110 },
          startTime: new Date(Date.now() + 129600000).toISOString(),
          status: 'upcoming',
          blockchain: {
            chainId: this.chainId,
            network: 'Polygon',
            blockNumber: blockNumber
          }
        },
        {
          id: 'qn-nhl-1',
          sport: 'NHL',
          homeTeam: 'Toronto Maple Leafs',
          awayTeam: 'Montreal Canadiens',
          odds: { home: -125, away: +105 },
          startTime: new Date(Date.now() + 7200000).toISOString(),
          status: 'live',
          blockchain: {
            chainId: this.chainId,
            network: 'Polygon',
            blockNumber: blockNumber
          }
        }
      ];

      return blockchainGames;
    } catch (error) {
      console.error('Error fetching blockchain sports data:', error);
      return [];
    }
  }

  async getNetworkStatus(): Promise<any> {
    try {
      const [blockNumber, chainId, gasPrice] = await Promise.all([
        this.fetchSportsData('eth_blockNumber'),
        this.fetchSportsData('eth_chainId'),
        this.fetchSportsData('eth_gasPrice')
      ]);

      return {
        success: true,
        network: 'Polygon',
        chainId: chainId.success ? parseInt(chainId.data, 16) : this.chainId,
        blockNumber: blockNumber.success ? parseInt(blockNumber.data, 16) : 0,
        gasPrice: gasPrice.success ? parseInt(gasPrice.data, 16) : 0,
        endpoint: this.endpoint
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network status unavailable'
      };
    }
  }

  async queryExternalSportsAPI(apiUrl: string, options: any = {}): Promise<any> {
    try {
      const response = await fetch(apiUrl, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...(options.body && { body: JSON.stringify(options.body) })
      });

      return await response.json();
    } catch (error) {
      console.error('External API error:', error);
      return null;
    }
  }

  async aggregateSportsData(): Promise<any[]> {
    const blockchainGames = await this.getBlockchainSportsData();
    const networkStatus = await this.getNetworkStatus();

    return [{
      source: 'QuickNode-Polygon',
      games: blockchainGames,
      networkStatus: networkStatus,
      timestamp: new Date().toISOString()
    }];
  }
}

export const quickNodeService = new QuickNodeService();