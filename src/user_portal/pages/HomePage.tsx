"use client";

import type React from "react";
import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService, LikePostResponse } from "../../api/services/postService";

interface Post {
  id: string;
  title: string;
  description: string;
  video_url: string;
  fullUrl: string;
  status: "pending" | "approved" | "rejected";
  user_id: string;
  approver_id: null | string;
  admin_id: null | string;
  approved_at: null | string;
  unique_traceability_id: null | string;
  views: number;
  likes: number;
  shares: number;
  category_id: number;
  createdAt: string;
  updatedAt: string;
  adminId: null | string;
  categoryId: number;
  user: {
    username: string;
    email: string;
  };
  PostLikes: any[];
}

interface Media {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  url: string;
  isVideo: boolean;
  caption: string;
  hashtags: string[];
  likes: string;
  comments: string;
  shares: string;
  isLiked: boolean;
}

const isVideoFile = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  const lowercaseUrl = url?.toLowerCase();
  return videoExtensions.some((ext) => lowercaseUrl?.endsWith(ext));
};

const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        console.log(
          "Fetching posts from:",
          `${import.meta.env.VITE_API_BASE_URL}/api/posts/user`
        );
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/posts/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (!response.data || !response.data.data) {
          console.log("No data in response:", response.data);
          return [];
        }

        console.log("API Response: ------->", response.data);
        return response.data || [];
      } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Like post mutation
  const likeMutation = useMutation<LikePostResponse, Error, string>({
    mutationFn: (postId: string) => postService.likePost(postId),
    onSuccess: (response) => {
      // Update the specific post in the cache
      queryClient.setQueryData(["posts"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((post: Post) => {
          if (post.id === response.data.post.id) {
            return {
              ...post,
              likes: response.data.post.likes,
              isLiked: response.data.isLiked,
            };
          }
          return post;
        });
      });
    },
  });

  // Unlike post mutation
  const unlikeMutation = useMutation({
    mutationFn: (postId: string) => postService.unlikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // Share post mutation
  const shareMutation = useMutation({
    mutationFn: (postId: string) => postService.sharePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      postService.addComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setComment("");
      setSelectedPost(null);
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">
          Error loading posts. Please try again later.
        </div>
      </div>
    );
  }

  // Transform posts to match the Media interface
  console.log("Posts array----------->:", posts);
  const postData = posts.data;
  const mediaItems: Media[] = Array.isArray(postData)
    ? postData.map((post: Post) => {
        // Construct the full URL for the media
        let url = post.fullUrl;
        if (!url && post.video_url) {
          // If we have a video_url but no fullUrl, construct it
          const baseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
          url = `${baseUrl}${post.video_url}`;
        }

        // Check if the current user has liked this post
        const isLiked = post.PostLikes?.length > 0;

        // Log the constructed URL for debugging
        console.log("Media URL:", url);
        console.log("Username-------> " + post?.user?.username);

        return {
          id: post.id,
          user: {
            name: post.user?.username || post.user?.email || "Anonymous",
            avatar: "/placeholder.svg",
          },
          url,
          isVideo: isVideoFile(url),
          caption: post.title || "",
          hashtags: [`category-${post.categoryId || post.category_id}`],
          likes: post.likes?.toString() || "0",
          comments: "0",
          shares: post.shares?.toString() || "0",
          isLiked,
        };
      })
    : [];
  console.log(mediaItems);

  if (!mediaItems.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">No posts available.</div>
      </div>
    );
  }

  const handleLikeClick = async (postId: string, currentlyLiked: boolean) => {
    try {
      await likeMutation.mutateAsync(postId);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleShareClick = async (postId: string) => {
    try {
      await shareMutation.mutateAsync(postId);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!comment.trim()) return;
    try {
      await commentMutation.mutateAsync({ postId, content: comment });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="h-full snap-y snap-mandatory overflow-y-scroll bg-black">
      {mediaItems.map((media) => (
        <div
          key={media.id}
          className="h-full snap-start relative flex justify-center items-center"
        >
          {/* Main content container with video and info */}
          <div className="relative w-[calc(100vh*9/16)] h-full max-w-[500px] bg-black">
            {media.isVideo ? (
              <video
                key={media.url}
                src={media.url}
                className="absolute inset-0 w-full h-full object-contain"
                crossOrigin="anonymous"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />
            ) : (
              <img
                src={media.url}
                alt={media.caption}
                className="absolute inset-0 w-full h-full object-contain"
                crossOrigin="anonymous"
                onError={(e) => {
                  // console.error('Error loading image:', media.url);
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}

            {/* Media Info - Positioned at the bottom */}
            <div className="absolute bottom-4 left-4 right-12 text-white z-10">
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={media.user.avatar}
                  alt={media.user.name}
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
                <span className="font-medium text-sm">{media.user.name}</span>
              </div>
              <p className="text-sm mb-2 line-clamp-2">{media.caption}</p>
              <div className="flex flex-wrap gap-2">
                {media.hashtags.map((tag) => (
                  <span key={tag} className="text-xs text-pink-400">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Comment Input */}
            {selectedPost === media.id && (
              <div className="absolute bottom-20 left-4 right-12 bg-black bg-opacity-50 p-4 rounded-lg z-20">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-2 rounded bg-gray-800 text-white resize-none text-sm"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleCommentSubmit(media.id)}
                    disabled={commentMutation.isPending || !comment.trim()}
                    className="px-4 py-1 bg-pink-500 text-white rounded text-sm hover:bg-pink-600 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - Positioned closer to the video */}
          <div className="absolute right-2 h-[60%] flex flex-col items-center justify-end space-y-3 bottom-20">
            <div className="flex flex-col items-center">
              <button
                className={`group p-1 text-white hover:text-pink-500 transition-colors ${
                  media.isLiked ? "text-pink-500" : ""
                }`}
                onClick={() => handleLikeClick(media.id, media.isLiked)}
                disabled={likeMutation.isPending || unlikeMutation.isPending}
              >
                <div className="bg-black bg-opacity-50 rounded-full p-2 group-hover:bg-opacity-70">
                  <Heart
                    className={`h-6 w-6 ${media.isLiked ? "fill-current" : ""}`}
                  />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {media.likes}
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <button
                className="group p-1 text-white hover:text-pink-500 transition-colors"
                onClick={() =>
                  setSelectedPost(selectedPost === media.id ? null : media.id)
                }
              >
                <div className="bg-black bg-opacity-50 rounded-full p-2 group-hover:bg-opacity-70">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {media.comments}
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <button
                className="group p-1 text-white hover:text-pink-500 transition-colors"
                onClick={() => handleShareClick(media.id)}
                disabled={shareMutation.isPending}
              >
                <div className="bg-black bg-opacity-50 rounded-full p-2 group-hover:bg-opacity-70">
                  <Share2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold mt-1">
                  {media.shares}
                </span>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <button className="group p-1 text-white hover:text-pink-500 transition-colors">
                <div className="bg-black bg-opacity-50 rounded-full p-2 group-hover:bg-opacity-70">
                  <Bookmark className="h-6 w-6" />
                </div>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomePage;
