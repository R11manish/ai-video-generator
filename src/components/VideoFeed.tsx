"use client";

import { useRef, useState, useEffect } from "react";
import { Video } from "@/types/video";
import VideoPlayer from "./VideoPlayer";

interface VideoFeedProps {
  videos: Video[];
  onIndexChange?: (index: number) => void;
}

const VideoFeed = ({ videos, onIndexChange }: VideoFeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // Handle scroll navigation with improved detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Set scrolling state to prevent interference with video controls
      setIsScrolling(true);

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const videoHeight = container.clientHeight;

        // Calculate index with more precision
        const index = Math.round(scrollTop / videoHeight);
        const normalizedIndex = Math.max(0, Math.min(index, videos.length - 1));

        if (normalizedIndex !== currentIndex) {
          setCurrentIndex(normalizedIndex);
          // Notify parent component about index change
          if (onIndexChange) {
            onIndexChange(normalizedIndex);
          }
        }

        // Set a timeout to indicate scrolling has stopped
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      });
    };

    // Initial check to ensure the first video plays
    handleScroll();

    container.addEventListener("scroll", handleScroll);

    // Also check on window resize
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentIndex, onIndexChange, videos.length]);

  // Handle touch events for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -50;
    const isSwipeUp = distance > 50;
    const container = containerRef.current;

    if (isSwipeDown && currentIndex > 0 && container) {
      // Swipe down, go to previous video
      container.scrollTo({
        top: (currentIndex - 1) * container.clientHeight,
        behavior: "smooth",
      });
    } else if (isSwipeUp && currentIndex < videos.length - 1 && container) {
      // Swipe up, go to next video
      container.scrollTo({
        top: (currentIndex + 1) * container.clientHeight,
        behavior: "smooth",
      });
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Preload the next video for smoother transitions
  useEffect(() => {
    if (currentIndex < videos.length - 1) {
      const nextVideoUrl = videos[currentIndex + 1].url;
      const preloadLink = document.createElement("link");
      preloadLink.rel = "preload";
      preloadLink.as = "video";
      preloadLink.href = nextVideoUrl;
      document.head.appendChild(preloadLink);

      return () => {
        document.head.removeChild(preloadLink);
      };
    }
  }, [currentIndex, videos]);

  // Explicitly scroll to the current video when index changes
  // This ensures perfect alignment after user interaction
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isScrolling) return;

    const videoHeight = container.clientHeight;
    const targetPosition = currentIndex * videoHeight;

    // Only adjust if we're not exactly aligned (prevents infinite loops)
    if (Math.abs(container.scrollTop - targetPosition) > 5) {
      container.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex, isScrolling]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="h-full w-full snap-start snap-always"
          data-index={index}
        >
          <VideoPlayer video={video} isInView={index === currentIndex} />
        </div>
      ))}
    </div>
  );
};

export default VideoFeed;
