import apiClient from '../apiClient';
import axios from 'axios';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Approver {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ApproverRequest {
  username: string;
  email: string;
  password: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  video_url: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string | null;
  approver_id: string | null;
  admin_id: string | null;
  approved_at: string | null;
  unique_traceability_id: string | null;
  views: number;
  likes: number;
  shares: number;
  category_id: number | null;
  createdAt: string;
  updatedAt: string;
  adminId: string | null;
  categoryId: number | null;
  user: {
    username: string;
    email: string;
  } | null;
  caption?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalApprovers: number;
  pendingVideos: number;
  approvedVideos: number;
  rejectedVideos: number;
  frozenUsers: number;
  activeUsers: number;
  // Add other stats fields as needed based on the backend response
}

export interface UserStats {
  users: {
    total: number;
    active: number;
    frozen: number;
  };
  posts: {
    total: number;
    approved: number;
    pending: number;
  };
}

export interface UserStatsResponse {
  status: string;
  data: UserStats;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  status: string;
  postsApproved: number;
  postsPending: number;
  posts_count: number;
  phone1?: string;
  phone2?: string;
}

export interface UsersResponse {
  status: string;
  data: {
    users: User[];
  };
}

export const adminService = {
  // User management
  getAllUsers: async (): Promise<UsersResponse> => {
    try {
      const response = await apiClient.get('/api/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  manageAccount: async (data: { userId: string; action: 'freeze' | 'reactivate' }): Promise<any> => {
    try {
      // Ensure the parameters match the API's expectations
      const payload = {
        id: data.userId,
        action: data.action
      };
      
      const response = await apiClient.post('/api/admin/accounts/manage', payload);
      return response.data;
    } catch (error) {
      console.error('Error managing account:', error);
      throw error;
    }
  },

  // Approver management
  getAllApprovers: async (): Promise<Approver[]> => {
    const response = await apiClient.get<Approver[]>('/api/admin/approvers');
    return response.data;
  },

  getApproverById: async (id: string): Promise<Approver> => {
    const response = await apiClient.get<Approver>(`/api/admin/approvers/${id}`);
    return response.data;
  },

  registerApprover: async (data: ApproverRequest): Promise<Approver> => {
    const response = await apiClient.post<Approver>('/api/admin/approvers', data);
    return response.data;
  },

  deleteApprover: async (username: string): Promise<void> => {
    await apiClient.delete(`/api/admin/approvers/${username}`);
  },

  // Post management
  getAllApprovedPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: { posts: Post[] } }>('/api/admin/approved/posts');
      // Check if response has the expected format with nested posts array
      if (response.data && response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.posts)) {
        return response.data.data.posts;
      } else if (Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      console.error("Unexpected response format for approved posts:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching approved posts:", error);
      return [];
    }
  },

  getPendingPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: { posts: Post[] } }>('/api/admin/posts/pending');
      
      // Check if response has a nested posts property
      if (response.data && response.data.status === 'success' && response.data.data && Array.isArray(response.data.data.posts)) {
        return response.data.data.posts;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error("Unexpected response format for pending posts:", response.data);
        return [];
      }
    } catch (error: any) {
      console.error("Error fetching pending posts:", error);
      return [];
    }
  },

  getRejectedPosts: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get<{ status: string; data: Post[] }>('/api/admin/posts/rejected');
      // Check if response has the expected format
      if (response.data && response.data.status === 'success') {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
      }
      console.error("Unexpected response format for rejected posts:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching rejected posts:", error);
      return [];
    }
  },

  // Get posts approved by a specific approver
  getPostsApprovedByApprover: async (approverId: string): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>(`/api/admin/approvers/${approverId}/posts`);
    return response.data;
  },

  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<{ status: string; data: DashboardStats }>('/api/admin/dashboard/stats');
      
      // Assuming the actual stats are nested under a 'data' property in the response
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      } else {
        // Handle potential errors or unexpected response structure
        console.error("Error fetching dashboard stats or invalid response structure:", response.data);
        // Return a default/empty stats object or throw an error
        return {
          totalUsers: 0,
          totalApprovers: 0,
          pendingVideos: 0,
          approvedVideos: 0,
          rejectedVideos: 0,
          frozenUsers: 0,
          activeUsers: 0,
        };
      }
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      // Return default data
      return {
        totalUsers: 0,
        totalApprovers: 0,
        pendingVideos: 0,
        approvedVideos: 0,
        rejectedVideos: 0,
        frozenUsers: 0,
        activeUsers: 0,
      };
    }
  },

  updatePostStatus: async (data: { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }): Promise<any> => {
    const response = await apiClient.put(`/api/admin/posts/${data.id}/status`, data);
    return response.data;
  },

  getUserStats: async (): Promise<UserStatsResponse> => {
    try {
      const response = await apiClient.get('/api/admin/users/stats');
      
      // Check if response has the expected format
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data;
      } else {
        console.error("Unexpected user stats response format:", response.data);
        // Return a default response to prevent UI errors
        return {
          status: 'success',
          data: {
            users: {
              total: 0,
              active: 0,
              frozen: 0
            },
            posts: {
              total: 0,
              approved: 0,
              pending: 0
            }
          }
        };
      }
    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      // Return a default response instead of throwing to prevent UI errors
      return {
        status: 'error',
        data: {
          users: {
            total: 0,
            active: 0,
            frozen: 0
          },
          posts: {
            total: 0,
            approved: 0,
            pending: 0
          }
        }
      };
    }
  },
  
  // Search posts by ID or traceability ID
  searchPosts: async (query: string): Promise<Post[]> => {
    try {
      const response = await apiClient.get(`/api/admin/posts/search?q=${encodeURIComponent(query)}`);
      
      // Check if response has the expected format
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error("Unexpected response format for post search:", response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error searching posts:', error);
      return [];
    }
  },
  
  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await apiClient.get(`/api/admin/users/${userId}`);
      
      // Check if response has the expected format
      if (response.data && response.data.status === 'success' && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },
}; 