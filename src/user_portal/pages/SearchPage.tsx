import type React from "react";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { useSearchPosts } from "../../api/hooks/usePosts";
import Post from "../components/Post";

interface PostData {
  id: string;
  [key: string]: any;
}

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading } = useSearchPosts(searchQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    // The search will be triggered automatically by the query hook
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for posts, captions, or categories"
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
      </form>

      {isLoading ? (
        <div className="text-center text-gray-400">Searching...</div>
      ) : searchResults && searchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchResults.map((post: PostData) => (
            <Post key={post.id} {...post} />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center text-gray-400">No results found</div>
      ) : null}
    </div>
  );
};

export default SearchPage;
