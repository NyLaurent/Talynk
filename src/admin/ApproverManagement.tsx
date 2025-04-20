import React, { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiChevronDown, FiArrowDown, FiCopy, FiPlus, FiTrash2} from "react-icons/fi";
import { adminService, DashboardStats} from '../api/services/adminService';
import Navigation from '../components/overview/navigation';
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Tabs, Tab, TextField } from '@mui/material';

// Define interfaces for approver data based on actual API response
interface ApproverPerformance {
  approvalRate: number;
  averageResponseTime: number;
}

interface Approver {
  id: string;
  username: string;
  email: string;
  status: string;
  joinedDate: string;
  lastActive: string | null;
  totalApprovedPosts: string;
  performance: ApproverPerformance;
}

// interface ApproverResponse {
//   status: string;
//   data: {
//     approvers: Approver[];
//     total: number;
//   };
// }

interface ApproverPost {
  id: string;
  title: string;
  caption: string;
  status: 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  userId: string;
  username: string;
  rejectionReason?: string;
}

// Add refresh interval constant
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

const ApproverManagement: React.FC = () => {
  // State for approvers data
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(null);
  const [approverPosts, setApproverPosts] = useState<ApproverPost[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortField, setSortField] = useState<string | null>("totalApprovedPosts");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [tabValue, setTabValue] = useState(0);
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);
  
  // Modals state
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approverToDelete, setApproverToDelete] = useState<Approver | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // New approver form state
  const [newApprover, setNewApprover] = useState({
    username: '',
    email: '',
    password: '',
    specialty: ''
  });

  // Fetch approvers and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch approvers and dashboard stats in parallel
      const [approversResponse, statsResponse] = await Promise.all([
        adminService.getAllApprovers(),
        adminService.getDashboardStats()
      ]);
      
      // Handle approvers response based on actual API structure
      if (approversResponse && 
          typeof approversResponse === 'object' && 
          'status' in approversResponse && 
          approversResponse.status === 'success' && 
          'data' in approversResponse && 
          typeof approversResponse.data === 'object' &&
          approversResponse.data &&
          'approvers' in approversResponse.data && 
          Array.isArray(approversResponse.data.approvers)) {
        
        setApprovers(approversResponse.data.approvers);
        
        // Select the first approver by default if available
        if (approversResponse.data.approvers.length > 0) {
          setSelectedApprover(approversResponse.data.approvers[0]);
          fetchApproverPosts(approversResponse.data.approvers[0].id);
        }
      } else {
        console.error('Invalid approvers response:', approversResponse);
        setApprovers([]);
      }
      
      setDashboardStats(statsResponse);
      setError(null);
    } catch (err) {
      setError('Failed to fetch approvers data');
      console.error('Error fetching approvers data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh stats only
  const refreshStats = async () => {
    try {
      const statsResponse = await adminService.getDashboardStats();
      setDashboardStats(statsResponse);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  };

  // Fetch posts for a specific approver
  const fetchApproverPosts = async (approverId: string) => {
    setPostsLoading(true);
    try {
      // For demonstration, create some sample posts
      // In a real implementation, you would have an API endpoint to get posts by approver ID
      const mockPosts: ApproverPost[] = [
        {
          id: "post1",
          title: "Sample Approved Post",
          caption: "This is an approved post",
          status: "approved",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: "user1",
          username: "User One"
        },
        {
          id: "post2",
          title: "Sample Rejected Post",
          caption: "This post was rejected",
          status: "rejected",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: "user2",
          username: "User Two",
          rejectionReason: "Content policy violation"
        }
      ];
      
      setApproverPosts(mockPosts);
      
    } catch (err) {
      console.error('Error fetching approver posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshStats();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle approver selection
  const handleSelectApprover = (approver: Approver) => {
    setSelectedApprover(approver);
    fetchApproverPosts(approver.id);
  };

  // Handle copy ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopyTooltip(id);
    setTimeout(() => {
      setCopyTooltip(null);
    }, 2000);
  };

  // Sort handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Register new approver
  const handleRegisterApprover = async () => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      // Validate form
      if (!newApprover.username || !newApprover.email || !newApprover.password) {
        throw new Error('Please fill in all required fields');
      }
      
      // In a real implementation, this would be an API call
      const result = await adminService.registerApprover(newApprover);
      
      // Add the new approver to the list
      const newApproverWithDefaults: Approver = {
        id: result.id,
        username: newApprover.username,
        email: newApprover.email,
        status: 'active',
        joinedDate: new Date().toISOString(),
        lastActive: null,
        totalApprovedPosts: '0',
        performance: {
          approvalRate: 0,
          averageResponseTime: 0
        }
      };
      
      setApprovers(prev => [newApproverWithDefaults, ...prev]);
      
      // Reset form and close dialog
      setNewApprover({
        username: '',
        email: '',
        password: '',
        specialty: ''
      });
      
      setRegisterDialogOpen(false);
      await refreshStats();
      
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to register approver');
      console.error('Error registering approver:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete approver
  const handleDeleteApprover = async () => {
    if (!approverToDelete) return;
    
    setActionLoading(true);
    try {
      // In a real implementation, this would be an API call
      await adminService.deleteApprover(approverToDelete.id);
      
      // Remove the approver from the list
      setApprovers(prev => prev.filter(a => a.id !== approverToDelete.id));
      
      // If the deleted approver was selected, clear selection
      if (selectedApprover && selectedApprover.id === approverToDelete.id) {
        setSelectedApprover(null);
        setApproverPosts([]);
      }
      
      setDeleteDialogOpen(false);
      setApproverToDelete(null);
      await refreshStats();
      
    } catch (err) {
      setActionError('Failed to delete approver');
      console.error('Error deleting approver:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter approvers based on search
  const filteredApprovers = approvers.filter((approver) => {
    // Check for exact ID match first
    if (searchTerm && approver.id.toLowerCase() === searchTerm.toLowerCase()) {
      return true;
    }
    
    // Regular search
    return (
      approver.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approver.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort approvers
  const sortedApprovers = [...filteredApprovers].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: any = a[sortField as keyof Approver];
    let bValue: any = b[sortField as keyof Approver];
    
    // Handle date fields
    if (sortField === 'joinedDate') {
      aValue = new Date(a.joinedDate).getTime();
      bValue = new Date(b.joinedDate).getTime();
    }
    
    // Handle totalApprovedPosts (convert string to number)
    if (sortField === 'totalApprovedPosts') {
      aValue = parseInt(a.totalApprovedPosts) || 0;
      bValue = parseInt(b.totalApprovedPosts) || 0;
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Filter posts based on tab selection
  const filteredPosts = approverPosts.filter(post => {
    if (tabValue === 0) return true; // All posts
    if (tabValue === 1) return post.status === 'approved'; // Approved posts
    if (tabValue === 2) return post.status === 'rejected'; // Rejected posts
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Navigation */}
      <div className="mb-8">
        <Navigation />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-blue-500 mb-2">
            {approvers.length.toLocaleString() || '0'}
          </div>
          <div className="text-gray-600">Total Approvers</div>
          <div className="mt-4 h-12">
            <svg viewBox="0 0 100 30" className="w-full h-full text-blue-300 stroke-current">
              <path 
                d="M 0,15 Q 25,5 50,20 T 100,15" 
                fill="none" 
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-green-500 mb-2">
            {dashboardStats?.approvedVideos.toLocaleString() || '0'}
          </div>
          <div className="text-gray-600">Approved Videos</div>
          <div className="mt-4 h-12">
            <svg viewBox="0 0 100 30" className="w-full h-full text-green-300 stroke-current">
              <path 
                d="M 0,20 Q 20,15 40,20 T 70,10 T 100,15" 
                fill="none" 
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-5xl font-bold text-red-500 mb-2">
            {dashboardStats?.rejectedVideos.toLocaleString() || '0'}
          </div>
          <div className="text-gray-600">Rejected Videos</div>
          <div className="mt-4 h-12">
            <svg viewBox="0 0 100 30" className="w-full h-full text-red-300 stroke-current">
              <path 
                d="M 0,15 Q 30,25 60,10 T 100,15" 
                fill="none" 
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Approver Management</h1>
        <button 
          onClick={() => setRegisterDialogOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center"
        >
          <FiPlus className="mr-2" /> Register New Approver
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)]">
        {/* Left side - Approvers list */}
        <div className="lg:w-2/3 flex flex-col">
          {/* Search and sort - sticky */}
          <div className="sticky top-0 bg-white z-10 pb-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div className="w-full sm:w-auto flex-1">
                <div className="flex items-center bg-gray-100 rounded-full px-6 py-2 shadow-sm">
                  <FiSearch className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, name, or email"
                    className="bg-transparent outline-none pl-4 text-sm text-gray-700 w-full"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    className="flex items-center px-3 py-2 border rounded-full text-gray-700 border-gray-300 hover:bg-gray-100"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                  >
                    <FiArrowDown className="w-4 h-4 mr-2" />
                    Sort
                    <FiChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("username");
                            setShowSortMenu(false);
                          }}
                        >
                          Username (A-Z)
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("joinedDate");
                            setShowSortMenu(false);
                          }}
                        >
                          Date Joined (Newest First)
                        </button>
                        <button
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={() => {
                            handleSort("totalApprovedPosts");
                            setShowSortMenu(false);
                          }}
                        >
                          Most Approved Posts
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Approvers table */}
          <div className="overflow-y-auto pr-2 flex-grow">
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Approver ID</th>
                    <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("username")}>
                      Username
                      {sortField === "username" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => handleSort("totalApprovedPosts")}>
                      Approved
                      {sortField === "totalApprovedPosts" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedApprovers.length > 0 ? (
                    sortedApprovers.map((approver) => (
                      <tr 
                        key={approver.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedApprover?.id === approver.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectApprover(approver)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-xs font-mono bg-gray-100 p-1 rounded mr-1">{approver.id.substring(0, 8)}...</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyId(approver.id);
                              }}
                              className="text-blue-500 hover:text-blue-700 relative"
                            >
                              <FiCopy size={14} />
                              {copyTooltip === approver.id && (
                                <span className="absolute ml-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                  Copied!
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{approver.username}</td>
                        <td className="px-4 py-3">{approver.email}</td>
                        <td className="px-4 py-3 text-green-600">{approver.totalApprovedPosts}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            approver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {approver.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setApproverToDelete(approver);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                              title="Delete Approver"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No approvers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Right side - Selected approver details */}
        <div className="lg:w-1/3 lg:sticky lg:top-4 lg:self-start overflow-y-auto max-h-[calc(100vh-280px)]">
          {selectedApprover ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Approver header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{selectedApprover.username}</h2>
                    <p className="text-gray-600">{selectedApprover.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedApprover.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedApprover.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {/* Approver details */}
              <div className="p-4">
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Approver ID</div>
                  <div className="flex items-center">
                    <span className="text-sm font-mono bg-gray-100 p-1 rounded">{selectedApprover.id}</span>
                    <button 
                      onClick={() => handleCopyId(selectedApprover.id)}
                      className="ml-2 text-blue-500 hover:text-blue-700 relative"
                    >
                      <FiCopy size={16} />
                      {copyTooltip === selectedApprover.id && (
                        <span className="absolute ml-2 bg-gray-800 text-white text-xs rounded py-1 px-2">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Joined</div>
                  <div className="text-sm">{new Date(selectedApprover.joinedDate).toLocaleDateString()}</div>
                </div>
              </div>
              
              {/* Approver stats */}
              <div className="p-4 border-t border-gray-200">
                <h3 className="font-bold mb-3">Approval Statistics</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedApprover.totalApprovedPosts}</div>
                    <div className="text-sm text-gray-600">Approved Posts</div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{(selectedApprover.performance.approvalRate * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Approval Rate</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="text-2xl font-bold">
                    {selectedApprover.totalApprovedPosts}
                  </div>
                  <div className="text-sm text-gray-600">Total Reviewed</div>
                </div>
                
                {/* Performance */}
                {parseInt(selectedApprover.totalApprovedPosts) > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Performance</div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ 
                          width: `${selectedApprover.performance.approvalRate * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Average Response Time</div>
                  <div className="text-sm font-medium">
                    {selectedApprover.performance.averageResponseTime} minutes
                  </div>
                </div>
                
                {/* Last active */}
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Last Active</div>
                  <div className="text-sm">
                    {selectedApprover.lastActive 
                      ? new Date(selectedApprover.lastActive).toLocaleString() 
                      : 'Never logged in'}
                  </div>
                </div>
              </div>
              
              {/* Approver posts */}
              <div className="border-t border-gray-200">
                <div className="p-4">
                  <h3 className="font-bold mb-3">Recent Activity</h3>
                  
                  {/* Tabs for different post types */}
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    aria-label="approver posts tabs"
                    className="mb-3"
                  >
                    <Tab label="All" />
                    <Tab label="Approved" />
                    <Tab label="Rejected" />
                  </Tabs>
                  
                  {postsLoading ? (
                    <div className="flex justify-center py-4">
                      <CircularProgress size={24} />
                    </div>
                  ) : filteredPosts.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {filteredPosts.slice(0, 5).map((post) => (
                        <div key={post.id} className="border border-gray-200 rounded p-2">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-sm truncate">{post.title}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              post.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {post.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            By: {post.username} • {new Date(post.updatedAt).toLocaleDateString()}
                          </div>
                          {post.status === 'rejected' && post.rejectionReason && (
                            <div className="mt-1 text-xs text-red-600">
                              Reason: {post.rejectionReason}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {filteredPosts.length > 5 && (
                        <div className="text-center">
                          <button className="text-blue-500 text-sm hover:underline">
                            View all {filteredPosts.length} posts
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No {tabValue === 0 ? '' : tabValue === 1 ? 'approved' : 'rejected'} posts found
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col space-y-2">
                  <button 
                    onClick={() => {
                      setApproverToDelete(selectedApprover);
                      setDeleteDialogOpen(true);
                    }}
                    className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                  >
                    <FiTrash2 className="mr-2" /> Delete Approver
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Select an approver to view details
            </div>
          )}
        </div>
      </div>
      
      {/* Register Approver Dialog */}
      <Dialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Register New Approver
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="mb-4">
            Enter the details for the new approver account.
          </DialogContentText>
          
          <div className="space-y-4 mt-2">
            <TextField
              autoFocus
              label="Username"
              fullWidth
              variant="outlined"
              value={newApprover.username}
              onChange={(e) => setNewApprover({...newApprover, username: e.target.value})}
              required
            />
            
            <TextField
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={newApprover.email}
              onChange={(e) => setNewApprover({...newApprover, email: e.target.value})}
              required
            />
            
            <TextField
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={newApprover.password}
              onChange={(e) => setNewApprover({...newApprover, password: e.target.value})}
              required
            />
            
            <TextField
              label="Specialty (Optional)"
              fullWidth
              variant="outlined"
              value={newApprover.specialty}
              onChange={(e) => setNewApprover({...newApprover, specialty: e.target.value})}
              placeholder="e.g. Music, Sports, Comedy"
            />
          </div>
          
          {actionError && (
            <div className="mt-4 text-red-500">{actionError}</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleRegisterApprover} 
            color="primary" 
            disabled={actionLoading}
            variant="contained"
            className="bg-blue-500"
          >
            {actionLoading ? 'Registering...' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Approver Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete Approver
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {approverToDelete?.username}'s approver account? This action cannot be undone.
          </DialogContentText>
          {actionError && (
            <div className="mt-4 text-red-500">{actionError}</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteApprover} 
            color="primary" 
            disabled={actionLoading}
            variant="contained"
            className="bg-red-500"
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ApproverManagement;
