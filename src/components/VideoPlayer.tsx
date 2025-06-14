"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { Video as VideoType } from "@/types/video";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState, useEffect } from "react";

interface VideoPlayerProps {
  video: VideoType;
  isInView: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const VideoPlayer = ({ video, isInView }: VideoPlayerProps) => {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      document.querySelectorAll("video").forEach((video) => {
        if (!video.paused) {
          video.muted = false;
        }
      });
    };

    document.addEventListener("click", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
    };
  }, []);

  const { videoRef, isPlaying, progress, isLiked, togglePlay, toggleLike } =
    useVideoPlayer({
      isInView,
      hasUserInteracted,
    });

  return (
    <div className="relative h-full w-full">
      <AspectRatio ratio={9 / 16} className="w-full">
        <video
          ref={videoRef}
          className="absolute inset-0 object-cover w-full h-full"
          src={video.url}
          loop
          muted={!hasUserInteracted}
          playsInline
          autoPlay={isInView}
          onClick={togglePlay}
        />
      </AspectRatio>

      <div
        className="absolute inset-0 flex flex-col justify-between pointer-events-none"
        onClick={togglePlay}
      >
        <div className="flex-1"></div>

        <div className="p-4 z-10 pointer-events-auto">
          <div className="mb-2">
            <p className="text-white font-semibold text-lg">{video.username}</p>
            <p className="text-white text-sm">{video.caption}</p>
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-20 flex flex-col space-y-6 items-center">
        <button
          className="flex flex-col items-center pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike();
          }}
        >
          <div
            className={`p-2 rounded-full ${
              isLiked ? "text-tiktok-red" : "text-white"
            }`}
          >
            <Heart
              fill={isLiked ? "#FE2C55" : "none"}
              className={`w-8 h-8 ${isLiked ? "animate-pulse-heart" : ""}`}
            />
          </div>
          <span className="text-white text-xs">
            {formatNumber(video.likes)}
          </span>
        </button>

        <button className="flex flex-col items-center pointer-events-auto">
          <div className="p-2 rounded-full text-white">
            <MessageCircle className="w-8 h-8" />
          </div>
          <span className="text-white text-xs">
            {formatNumber(video.comments)}
          </span>
        </button>

        <button className="flex flex-col items-center pointer-events-auto">
          <div className="p-2 rounded-full text-white">
            <Share2 className="w-8 h-8" />
          </div>
          <span className="text-white text-xs">Share</span>
        </button>
      </div>

      <div className="video-progress">
        <div
          className="video-progress-inner"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-40 rounded-full p-4">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {!hasUserInteracted && isInView && (
        <div className="absolute bottom-32 left-0 right-0 flex justify-center">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm animate-pulse">
            Click anywhere to enable sound
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
