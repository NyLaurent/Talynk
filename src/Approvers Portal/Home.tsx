import { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar"
import Sidebar from "@/components/overview/sidebar"
import Cards from "../components/Cards"
import { data as originalData } from "../data"
import Pending from "@/Reusable/pending"
import Videos from '../components/overview/Videos'
import { adminService, Post as AdminPost } from '@/api/services/adminService'
import { approverService } from '@/api/services/approverService'
import { CircularProgress } from "@mui/material";
import { Alert, Snackbar } from "@mui/material";
import { IoCheckmarkCircle } from 'react-icons/io5';
import Navigation from '@/components/overview/navigation';

// Add refresh interval constant
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

// Define a type for our stats cards that includes the required image property for CardItem
interface StatCard {
    id: number;
    text: string;
    count: number | string;
    color?: string;
    image: string; // Make sure this is required to match CardItem
}

// Create a local interface for approver stats to be used in this component
interface ApproverDashboardStats {
    pendingVideos: number;
    approvedVideos: number;
    rejectedVideos: number;
    todayVideos: number;
}

// Use the Post type from approverService
interface ApproverPost {
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

// Extend the adminService with the missing method
const extendedAdminService = {
    ...adminService,
    // Add the missing method
    updatePostStatusAsApprover: async (data: { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }): Promise<any> => {
        return adminService.updatePostStatus(data);
    }
};

const Home = () => {
    const [pendingPosts, setPendingPosts] = useState<ApproverPost[]>([]);
    const [stats, setStats] = useState<ApproverDashboardStats | null>(null);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");

    // Create stat cards from API data or fallback to mock data
    const getStatCards = (): StatCard[] => {
        if (stats) {
            return [
                { id: 1, text: "Pending Videos", count: stats.pendingVideos, color: "#FFC107", image: "/src/assets/chart.svg" },
                { id: 2, text: "Approved Videos", count: stats.approvedVideos, color: "#4CAF50", image: "/src/assets/chart.svg" },
                { id: 3, text: "Rejected Videos", count: stats.rejectedVideos, color: "#F44336", image: "/src/assets/chart.svg" },
                { id: 4, text: "Today's Reviews", count: stats.todayVideos, color: "#2196F3", image: "/src/assets/chart.svg" },
            ];
        } else {
            // Convert mock data to match our StatCard type and ensure it has the required image property
            return originalData.slice(0, 5).map(item => ({
                ...item,
                color: "#2196F3", // Add a default color
                image: item.image || "/src/assets/chart.svg" // Ensure there's always an image
            }));
        }
    };
    
    // Fetch data function with useCallback for memoization
    const fetchData = useCallback(async () => {
        try {
            setIsLoadingPosts(true);
            setIsLoadingStats(true);
            setError(null);
            
            // Fetch pending posts from approverService
            const postsResponse = await approverService.getPendingPosts();
            
            if (postsResponse && Array.isArray(postsResponse)) {
                // Type the posts correctly
                setPendingPosts(postsResponse as any);
                
                // Show notification if there are new pending posts
                if (postsResponse.length > 0 && pendingPosts.length < postsResponse.length) {
                    setSnackbarMessage(`${postsResponse.length} pending videos to review`);
                    setSnackbarSeverity("info");
                    setSnackbarOpen(true);
                }
            } else {
                console.error("Invalid posts response format");
            }
            
            // Fetch stats from approverService
            const statsResponse = await approverService.getApproverStats();
            if (statsResponse) {
                // Convert the API response to our dashboard stats format
                setStats({
                    pendingVideos: statsResponse.pendingCount,
                    approvedVideos: statsResponse.approvedCount,
                    rejectedVideos: statsResponse.rejectedCount,
                    todayVideos: statsResponse.todayCount
                });
            }
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to fetch data. Please try again.");
            
            if (err.message.includes("Authentication required")) {
                setSnackbarMessage("Authentication error. Please log in again.");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } finally {
            setIsLoadingPosts(false);
            setIsLoadingStats(false);
        }
    }, [pendingPosts.length]);

    // Handler for when a post is selected from the sidebar
    const handleSelectPost = (post: AdminPost) => {
        console.log("Selected post in Approvers Portal:", post.id);
        
        // Find if the post is in pending posts
        const pendingPost = pendingPosts.find(p => p.id === post.id);
        if (pendingPost) {
            // Scroll to the post
            const postElement = document.getElementById(`post-${post.id}`);
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth' });
                
                // Highlight the post
                postElement.classList.add('highlight-post');
                setTimeout(() => {
                    postElement.classList.remove('highlight-post');
                }, 2000);
            }
        } else {
            setSnackbarMessage("This post is not in your pending list");
            setSnackbarSeverity("info");
            setSnackbarOpen(true);
        }
    };
    
    // Handler for post approval/rejection
    const handlePostUpdate = async (postId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
        try {
            setSnackbarMessage(`Processing ${status} request...`);
            setSnackbarSeverity("info");
            setSnackbarOpen(true);
            
            if (status === 'approved') {
                await approverService.approvePost(postId);
            } else {
                await approverService.rejectPost(postId, rejectionReason);
            }
            
            // Remove the post from the pending list
            setPendingPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            
            // Refresh stats to reflect the changes
            await refreshStats();
            
            // Show success message
            setSnackbarMessage(`Post ${status} successfully`);
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
        } catch (err: any) {
            console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} post:`, err);
            setSnackbarMessage(`Error: ${err.message || "Failed to update post"}`);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };
    
    // Add a refreshStats function to update only dashboard stats
    const refreshStats = async () => {
        try {
            const statsResponse = await approverService.getApproverStats();
            if (statsResponse) {
                setStats({
                    pendingVideos: statsResponse.pendingCount,
                    approvedVideos: statsResponse.approvedCount,
                    rejectedVideos: statsResponse.rejectedCount,
                    todayVideos: statsResponse.todayCount
                });
            }
        } catch (err) {
            console.error('Error refreshing stats:', err);
        }
    };

    // Initial data load 
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Add auto-refresh effect for periodic updates
    useEffect(() => {
        // Set up an interval to refresh data automatically
        const intervalId = setInterval(() => {
            fetchData();
        }, REFRESH_INTERVAL);

        // Clean up the interval when component unmounts
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    return (
        <div className="container mx-auto p-4">
            {/* Talynk Logo */}
            <div className="flex justify-between items-center mb-4">
                <div></div> {/* Empty div for spacing */}
                <div className="flex items-center gap-2">
                    <IoCheckmarkCircle className="h-6 w-6 text-[#004896]" />
                    <h2 className="text-[#004896] font-bold text-xl">Talynk</h2>
                </div>
            </div>
            
            {/* Navigation component */}
            <div className="mb-8">
                <Navigation removeTab="User Management" />
            </div>
            
            {/* Layout with sidebar and main content */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <div className="lg:w-1/3">
                    <Sidebar onSelectPost={handleSelectPost} />
                </div>
                
                {/* Main content */}
                <div className="lg:w-2/3">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">Welcome, <span className="text-blue-600 font-bold">Approver</span></h1>
                        <p className="text-gray-600">You have {pendingPosts.length} pending posts to review</p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="mb-8">
                        {isLoadingStats ? (
                            <div className="flex justify-center items-center h-32">
                                <CircularProgress />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#FFC107] mb-2">
                                        {stats?.pendingVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Pending Videos</div>
                                    <div className="mt-4 h-12">
                                        <svg viewBox="0 0 100 30" className="w-full h-full text-[#FFF8E1] stroke-current">
                                            <path 
                                                d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                                                fill="none" 
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#4CAF50] mb-2">
                                        {stats?.approvedVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Approved Videos</div>
                                    <div className="mt-4 h-12">
                                        <svg viewBox="0 0 100 30" className="w-full h-full text-[#E8F5E9] stroke-current">
                                            <path 
                                                d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                                                fill="none" 
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#F44336] mb-2">
                                        {stats?.rejectedVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Rejected Videos</div>
                                    <div className="mt-4 h-12">
                                        <svg viewBox="0 0 100 30" className="w-full h-full text-[#FFEBEE] stroke-current">
                                            <path 
                                                d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                                                fill="none" 
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                    <div className="text-5xl font-bold text-[#2196F3] mb-2">
                                        {stats?.todayVideos || 0}
                                    </div>
                                    <div className="text-gray-600">Today's Reviews</div>
                                    <div className="mt-4 h-12">
                                        <svg viewBox="0 0 100 30" className="w-full h-full text-[#E3F2FD] stroke-current">
                                            <path 
                                                d="M 0,15 Q 20,5 40,15 T 80,15 T 100,15" 
                                                fill="none" 
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Pending Posts Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="mb-4">
                            <Pending />
                        </div>
                        
                        {isLoadingPosts ? (
                            <div className="flex justify-center items-center h-64">
                                <CircularProgress />
                            </div>
                        ) : error ? (
                            <div className="text-center p-8">
                                <Alert severity="error" className="mb-4">{error}</Alert>
                                <button 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    onClick={() => fetchData()}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : pendingPosts.length === 0 ? (
                            <div className="text-center p-8 text-gray-500">
                                <img 
                                    src="/src/assets/no-data.svg" 
                                    alt="No pending posts" 
                                    className="w-32 h-32 mx-auto mb-4 opacity-50"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <p className="text-xl font-medium">No pending posts to review at this time.</p>
                                <p className="mt-2">All caught up! Check back later for new submissions.</p>
                            </div>
                        ) : (
                            <div id="pending-posts-container">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                    {pendingPosts.map(post => (
                                        <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-lg shadow p-4 border border-gray-200 transition-all duration-300 hover:shadow-md">
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{post.title}</h3>
                                                    <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                    <span className="inline-flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path>
                                                        </svg>
                                                        {post.user?.username || "Unknown user"}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                                                
                                                {post.video_url && (
                                                    <div className="mb-4 rounded-lg overflow-hidden flex-grow">
                                                        <video 
                                                            src={`${import.meta.env.VITE_API_BASE_URL}${post.video_url}`}
                                                            className="w-full h-48 object-cover bg-gray-100" 
                                                            controls
                                                            poster="/src/assets/video-placeholder.jpg"
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="flex justify-between mt-auto pt-2 border-t border-gray-100">
                                                    <button 
                                                        onClick={() => handlePostUpdate(post.id, 'rejected')}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => handlePostUpdate(post.id, 'approved')}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            
            {/* Add CSS for post highlight effect */}
            <style>{`
                .highlight-post {
                    animation: highlight 2s ease-in-out;
                }
                
                @keyframes highlight {
                    0% { box-shadow: 0 0 0 0 rgba(0, 111, 253, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 111, 253, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 111, 253, 0); }
                }
                
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}

export default Home