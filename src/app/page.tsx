"use client";

import { useEffect, useState } from "react";
import VideoFeed from "@/components/VideoFeed";
import { getVideos, DynamoDBKey } from "@/actions/videoActions";
import { Video } from "@/types/video";
import { mockVideos } from "@/data/mockVideos";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<
    DynamoDBKey | undefined
  >(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch initial videos
  useEffect(() => {
    fetchVideos();
  }, []);

  // Function to fetch videos
  const fetchVideos = async (key?: DynamoDBKey) => {
    try {
      if (!key) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await getVideos(key);

      if (result.videos.length > 0) {
 
        if (!key) {
          setVideos(result.videos);
        } else {
          // If we're fetching more videos, append them
          setVideos((prev) => [...prev, ...result.videos]);
        }

        // Save the last key for pagination
        setLastEvaluatedKey(result.lastEvaluatedKey);

        // Check if there are more videos to load
        setHasMore(!!result.lastEvaluatedKey);
      } else if (!key) {
        // If this is the initial load and no videos were found, use mock videos
        setVideos(mockVideos);
        setError("Using mock videos as fallback");
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      if (!key) {
        // Only use fallback on initial load
        setError("Failed to fetch videos. Using mock videos as fallback.");
        setVideos(mockVideos);
      }
    } finally {
      if (!key) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more videos when user approaches the end
  useEffect(() => {
    // If we're 2 videos away from the end and we have more to load
    if (
      currentIndex >= videos.length - 2 &&
      hasMore &&
      !loadingMore &&
      videos.length > 0
    ) {
      fetchVideos(lastEvaluatedKey);
    }
  }, [currentIndex, videos.length, hasMore, loadingMore, lastEvaluatedKey]);

  // Forcing dark mode for TikTok-like appearance
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Handle current video index change
  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="bg-black h-screen w-full max-w-md mx-auto overflow-hidden flex items-center justify-center">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="bg-black h-screen w-full max-w-md mx-auto overflow-hidden">
      {error && (
        <div className="bg-red-500 text-white p-2 text-sm text-center">
          {error}
        </div>
      )}
      <VideoFeed videos={videos} onIndexChange={handleIndexChange} />
      {loadingMore && (
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <div className="inline-block bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
            Loading more...
          </div>
        </div>
      )}
    </div>
  );
}
