"use client";

import type React from "react";
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostProps {
  id: string;
  title: string;
  caption: string;
  file_url: string;
  post_category: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  likes: number;
  shares: number;
  comments: number;
  created_at: string;
  status: "pending" | "approved";
}

const Post: React.FC<PostProps> = ({
  title,
  caption,
  file_url,
  post_category,
  user,
  likes = 0,
  shares = 0,
  comments = 0,
  created_at,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Here you would typically update the like count on the server
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Here you would typically save/unsave the post on the server
  };

  // Ensure we have valid data
  const safeUser = {
    name: user?.name || "Anonymous",
    username: user?.username || "anonymous",
    avatar: user?.avatar || "/placeholder.svg",
  };
  console.log(safeUser);

  const safeDate = created_at ? new Date(created_at) : new Date();

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={safeUser.avatar}
            alt={safeUser.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="text-white font-medium">{safeUser.name}</h3>
            <p className="text-gray-400 text-sm">@{safeUser.username}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <img
        src={file_url || "/placeholder.svg"}
        alt={title || "Post image"}
        className="w-full aspect-square object-cover"
      />

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`text-gray-400 hover:text-red-500 flex items-center space-x-1 ${
                isLiked ? "text-red-500" : ""
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              <span>{likes}</span>
            </button>
            <button className="text-gray-400 hover:text-blue-500 flex items-center space-x-1">
              <MessageCircle className="h-5 w-5" />
              <span>{comments}</span>
            </button>
            <button className="text-gray-400 hover:text-green-500 flex items-center space-x-1">
              <Share2 className="h-5 w-5" />
              <span>{shares}</span>
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`text-gray-400 hover:text-yellow-500 ${
              isSaved ? "text-yellow-500" : ""
            }`}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>
        <h4 className="text-white font-medium mb-1">{title}</h4>
        <p className="text-gray-400">{caption}</p>
        {post_category && (
          <p className="text-blue-400 text-sm mt-2">#{post_category}</p>
        )}
        <p className="text-gray-500 text-sm mt-2">
          {formatDistanceToNow(safeDate, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default Post;
