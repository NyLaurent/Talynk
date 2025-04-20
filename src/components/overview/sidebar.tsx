import { useState, useEffect, useCallback } from "react";
import {
  IoChevronDown,
  IoChevronForward,
  IoExitOutline,
  IoPerson,
  IoSearch,
  IoNotifications,
  IoPersonCircle,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { adminService, Post } from "../../api/services/adminService";
import { CircularProgress } from "@mui/material";

// Extended User interface with additional properties
interface ExtendedUser {
  id: string;
  username: string;
  email: string;
  status?: string;
  profile_picture?: string;
  posts_count?: number;
  approved_posts_count?: number;
  pending_posts_count?: number;
  rejected_posts_count?: number;
}

interface SidebarProps {
  onSearchResults?: (results: Post[]) => void;
  onSelectPost?: (post: Post) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearchResults, onSelectPost }) => {
  const [selectedOption, setSelectedOption] = useState(
    "Find Post By Traceability ID"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundPostOwner, setFoundPostOwner] = useState<ExtendedUser | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchSuccess, setSearchSuccess] = useState<boolean>(false);

  // Clear search success message after delay
  useEffect(() => {
    if (searchSuccess) {
      const timer = setTimeout(() => {
        setSearchSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchSuccess]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!searchQuery.trim()) {
        setSearchError("Please enter a search term");
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setFoundPostOwner(null);
      setSearchResults([]);

      try {
        console.log("Searching for:", searchQuery.trim());
        const posts = await adminService.searchPosts(searchQuery.trim());

        if (posts && posts.length > 0) {
          // Set search results
          setSearchResults(posts);

          // Pass results to parent component if callback exists
          if (onSearchResults) {
            onSearchResults(posts);
          }

          // If we have onSelectPost, pass the first post to it
          if (onSelectPost) {
            onSelectPost(posts[0]);
          }

          // If post has a user_id, fetch the user details
          if (posts[0].user_id) {
            const userInfo = await adminService.getUserById(posts[0].user_id);
            setFoundPostOwner(userInfo as unknown as ExtendedUser);
          } else {
            setFoundPostOwner(null);
          }

          setSearchSuccess(true);
        } else {
          setSearchError("No posts found with that ID");
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchError("Error searching for posts. Please try again.");
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, onSearchResults, onSelectPost]
  );

  // Handle key press for search (Enter key)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  // Handle account freeze/unfreeze
  const handleAccountAction = async (action: "freeze" | "unfreeze") => {
    if (!foundPostOwner || !foundPostOwner.id) return;

    try {
      await adminService.manageAccount({
        userId: foundPostOwner.id,
        action: action === "freeze" ? "freeze" : "reactivate",
      });

      // Refresh the search results to get updated user status
      if (foundPostOwner.posts_count) {
        await adminService.getUserById(foundPostOwner.id);
      }
    } catch (err) {
      console.error(`Error ${action}ing account:`, err);
      setSearchError(`Failed to ${action} account. Please try again.`);
    }
  };

  return (
    <div className="bg-white h-full px-6 py-8 rounded-lg shadow-md border border-gray-100">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <IoCheckmarkCircle className="h-6 w-6 text-[#004896]" />
            <h2 className="text-[#004896] font-bold text-xl">Talynk</h2>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <IoSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full p-3 pl-10 pr-24 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search post by ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            required
          />
          <button
            type="submit"
            className="absolute right-2 inset-y-2 px-4 py-1 bg-[#004896] hover:bg-[#003572] rounded-md text-white text-sm transition-colors"
            disabled={isSearching}
          >
            {isSearching ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Search Feedback */}
        {searchSuccess && !searchError && (
          <div className="text-green-600 text-sm bg-green-50 p-2 rounded-md flex items-center">
            <IoCheckmarkCircle className="mr-1" /> Found {searchResults.length}{" "}
            post(s)
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
            {searchError}
          </div>
        )}

        {/* Post Owner Info */}
        {foundPostOwner && (
          <div className="border border-gray-200 rounded-lg p-4 mt-2 bg-white shadow-sm">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">
              Post Owner
            </h3>
            <div className="flex items-center mb-3">
              {foundPostOwner.profile_picture ? (
                <img
                  src={foundPostOwner.profile_picture}
                  alt="User"
                  className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-gray-200"
                />
              ) : (
                <IoPersonCircle className="w-12 h-12 text-gray-400 mr-3" />
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {foundPostOwner.username || "Unknown User"}
                </p>
                <p className="text-gray-500 text-sm">
                  {foundPostOwner.email || "No email"}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                    foundPostOwner.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {foundPostOwner.status === "active" ? "Active" : "Frozen"}
                </span>
              </div>
            </div>
            {foundPostOwner.posts_count !== undefined && (
              <div className="mt-3 grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-md">
                <div className="text-sm">
                  <span className="text-gray-500">Total Posts:</span>
                  <span className="ml-2 font-medium">
                    {foundPostOwner.posts_count || 0}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Approved:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {foundPostOwner.approved_posts_count || 0}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Pending:</span>
                  <span className="ml-2 font-medium text-yellow-600">
                    {foundPostOwner.pending_posts_count || 0}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Rejected:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {foundPostOwner.rejected_posts_count || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Account Actions */}
            {foundPostOwner.status && (
              <div className="mt-3">
                <button
                  onClick={() =>
                    handleAccountAction(
                      foundPostOwner.status === "active" ? "freeze" : "unfreeze"
                    )
                  }
                  className={`mt-2 w-full py-2 px-4 rounded-md text-white text-sm ${
                    foundPostOwner.status === "active"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  } transition-colors`}
                >
                  {foundPostOwner.status === "active"
                    ? "Freeze Account"
                    : "Unfreeze Account"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="bg-gray-50 px-4 py-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="relative">
              <IoNotifications className="h-5 w-5 text-gray-600" />
              <div className="h-2 w-2 bg-red-500 rounded-full absolute top-0 right-0" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
              <div className="mt-1">
                <IoPersonCircle className="h-8 w-8 text-blue-600 rounded-full" />
              </div>
              <div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    John David
                  </p>
                  <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                    Just now
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  A new post pending approval from{" "}
                  {foundPostOwner?.username || "a user"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors">
              <div className="mt-1">
                <IoPersonCircle className="h-8 w-8 text-gray-600 rounded-full" />
              </div>
              <div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    Robert Miles
                  </p>
                  <span className="text-xs text-gray-500">1h ago</span>
                </div>
                <p className="text-xs text-gray-600">
                  Created a new role Approver
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-2 hover:bg-gray-100 rounded-md transition-colors">
              <div className="mt-1">
                <IoPersonCircle className="h-8 w-8 text-gray-600 rounded-full" />
              </div>
              <div>
                <div className="flex gap-1 items-center">
                  <p className="text-sm font-semibold text-gray-800">
                    Robert Miles
                  </p>
                  <span className="text-xs text-gray-500">1h ago</span>
                </div>
                <p className="text-xs text-gray-600">
                  Added new content for review
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
