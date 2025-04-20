import type React from "react";
import { useState } from "react";
import { Search } from "lucide-react";
import Post from "../components/Post";
import { useAllPosts } from "../../api/hooks/usePosts";

const ExplorePage: React.FC = () => {
  const { data: posts, isLoading, error } = useAllPosts();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Error loading posts
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Search Bar */}
      <div className="p-4 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="search"
            placeholder="Search anything"
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {posts?.map((post: any) => (
          <Post key={post.id} {...post} />
        ))}
      </div>
    </div>
  );
};

export default ExplorePage;
