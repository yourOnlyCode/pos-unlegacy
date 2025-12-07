// Smart API router that automatically routes to edge device or cloud
export class ApiRouter {
  private businessId: string;
  private baseUrl: string | null = null;

  constructor(businessId: string) {
    this.businessId = businessId;
  }

  async getApiEndpoint(): Promise<string> {
    if (this.baseUrl) {
      return this.baseUrl;
    }

    try {
      const response = await fetch(`/api/business/${this.businessId}/config`);
      const config = await response.json();

      if (config.deploymentType === 'edge' && config.edgeApiEndpoint) {
        // Try edge device first
        try {
          await fetch(`${config.edgeApiEndpoint}/api/health`, { 
            method: 'GET'
          });
          this.baseUrl = config.edgeApiEndpoint;
          return this.baseUrl as string;
        } catch (error) {
          console.log('Edge device unavailable, using cloud');
        }
      }

      // Default to cloud
      this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return this.baseUrl;
    } catch (error) {
      console.error('Failed to get API endpoint, defaulting to cloud:', error);
      this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return this.baseUrl;
    }
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    const baseUrl = await this.getApiEndpoint();
    const url = `${baseUrl}${endpoint}`;
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  // Convenience methods
  async get(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.makeRequest(endpoint, { method: 'DELETE' });
  }
}