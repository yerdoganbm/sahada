/**
 * API Client for Sahada App
 * Centralized HTTP client for all API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      return { error: error.message };
    }
  }

  // ============================================
  // PLAYERS
  // ============================================

  async getPlayers(teamId?: string, role?: string) {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (role) params.append('role', role);
    
    return this.request(`/players?${params.toString()}`);
  }

  async getPlayer(id: string) {
    return this.request(`/players/${id}`);
  }

  async createPlayer(player: any) {
    return this.request('/players', {
      method: 'POST',
      body: JSON.stringify(player),
    });
  }

  async updatePlayer(id: string, updates: any) {
    return this.request(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/players/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // MATCHES
  // ============================================

  async getMatches(teamId?: string, status?: string, upcoming?: boolean) {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (status) params.append('status', status);
    if (upcoming) params.append('upcoming', 'true');
    
    return this.request(`/matches?${params.toString()}`);
  }

  async getMatch(id: string) {
    return this.request(`/matches/${id}`);
  }

  async createMatch(match: any) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    });
  }

  async updateMatch(id: string, updates: any) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateMatchRSVP(matchId: string, playerId: string, status: string) {
    return this.request(`/matches/${matchId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ playerId, status }),
    });
  }

  // ============================================
  // VENUES
  // ============================================

  async getVenues() {
    return this.request('/venues');
  }

  async getVenue(id: string) {
    return this.request(`/venues/${id}`);
  }

  async createVenue(venue: any) {
    return this.request('/venues', {
      method: 'POST',
      body: JSON.stringify(venue),
    });
  }

  // ============================================
  // PAYMENTS
  // ============================================

  async getPayments(teamId?: string, playerId?: string, status?: string) {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (playerId) params.append('playerId', playerId);
    if (status) params.append('status', status);
    
    return this.request(`/payments?${params.toString()}`);
  }

  async updatePayment(id: string, updates: any) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  async getTransactions(teamId?: string, category?: string) {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (category) params.append('category', category);
    
    return this.request(`/transactions?${params.toString()}`);
  }

  async createTransaction(transaction: any) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // ============================================
  // TEAMS
  // ============================================

  async getTeam(id: string) {
    return this.request(`/teams/${id}`);
  }

  async createTeam(team: any) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }

  // ============================================
  // POLLS
  // ============================================

  async getPolls(teamId?: string) {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    
    return this.request(`/polls?${params.toString()}`);
  }

  async votePoll(pollId: string, optionId: string, userId: string) {
    return this.request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId, userId }),
    });
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async checkHealth() {
    return this.request('/health');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
