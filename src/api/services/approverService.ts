import apiClient from '../apiClient';

interface Post {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  user: {
    username: string;
    email: string;
  };
  approver_id: string | null;
  admin_id: string | null;
  approved_at: string | null;
  unique_traceability_id: string | null;
  views: number;
  likes: number;
  shares: number;
  category_id: number;
  createdAt: string;
  updatedAt: string;
}

interface Report {
  id: string;
  content: string;
  approverId: string;
  createdAt: string;
}

// Interface for approver stats based on the provided sample response
interface ApproverStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  todayCount: number;
}

// Interface for pagination response
interface PaginatedPostsResponse {
  status: string;
  data: {
    posts: Post[];
    total: number;
    pages: number;
    currentPage: number;
  };
}

export const approverService = {
  // Post management
  getPendingPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<PaginatedPostsResponse>('/api/approver/posts/pending');
      
      // Check if response has the expected nested structure
      if (response.data && response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.posts)) {
        return response.data.data.posts;
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array response
        return response.data;
      } else {
        console.error("Unexpected response format for pending posts:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching pending posts:", error);
      return [];
    }
  },

  getApprovedPosts: async (): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>('/api/approver/posts/approved');
    return response.data;
  },

  approvePost: async (postId: string): Promise<Post> => {
    const response = await apiClient.put<Post>(`/api/approver/posts/${postId}/approve`);
    return response.data;
  },

  rejectPost: async (postId: string, rejectionReason?: string): Promise<Post> => {
    const response = await apiClient.put<Post>(`/api/approver/posts/${postId}/reject`, 
      rejectionReason ? { reason: rejectionReason } : undefined
    );
    return response.data;
  },

  // Stats management
  getApproverStats: async (): Promise<ApproverStats> => {
    const response = await apiClient.get<{ status: string; data: ApproverStats }>('/api/approver/stats');
    return response.data.data;
  },

  // Report management
  generateReport: async (data: { content: string }): Promise<Report> => {
    const response = await apiClient.post<Report>('/api/approver/reports', data);
    return response.data;
  },
}; 