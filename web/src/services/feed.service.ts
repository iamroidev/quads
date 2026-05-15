import api from './api';
import { ProductPopulated } from '../types';

export interface PulseFeedResponse {
  success: boolean;
  data: {
    pulse: ProductPopulated[];
    sections: {
      nearYou: ProductPopulated[];
      trending: ProductPopulated[];
      newArrivals: ProductPopulated[];
    };
  };
}

class FeedService {
  /**
   * Get the Campus Pulse discovery feed
   */
  async getPulseFeed(): Promise<PulseFeedResponse> {
    const response = await api.get('/feed/pulse');
    return response.data;
  }
}

export default new FeedService();
