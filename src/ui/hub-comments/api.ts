import axios from 'axios';
import { getAccessToken } from '../../auth/token-manager.js';

export interface HubComment {
  id: number;
  authorId: string;
  authorRole: string;
  targetId: string;
  sourceApp: string;
  contextType: string | null;
  contextLabel: string | null;
  contextUrl: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    member_type: string;
  } | null;
}

export interface HubCommentPartner {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  unreadCount: number;
  lastMessage: HubComment;
}

export class HubCommentApi {
  private client: import('axios').AxiosInstance;

  constructor(hubApiUrl: string) {
    this.client = axios.create({
      baseURL: hubApiUrl,
      timeout: 10000,
    });

    this.client.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getPartners(): Promise<HubCommentPartner[]> {
    const res = await this.client.get('/hub-comments/partners');
    return res.data?.data || [];
  }

  async getConversation(partnerId: string, limit = 50, offset = 0): Promise<{ comments: HubComment[], total: number }> {
    const res = await this.client.get(`/hub-comments/conversation/${partnerId}?limit=${limit}&offset=${offset}`);
    // 서버가 최신순으로 반환한다고 가정하고 프론트에서 시간순으로 정렬
    const data = res.data?.data;
    if (data && data.comments) {
      data.comments.sort((a: HubComment, b: HubComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return data;
  }

  async createComment(data: {
    target_id: string;
    content: string;
    source_app?: string;
  }): Promise<HubComment> {
    const res = await this.client.post('/hub-comments', data);
    return res.data?.data;
  }

  async markAllAsRead(partnerId: string): Promise<void> {
    await this.client.patch(`/hub-comments/read-all/${partnerId}`);
  }

  async getUnreadCount(): Promise<number> {
    const res = await this.client.get('/hub-comments/unread-count');
    return res.data?.data || 0;
  }
}
