"use client";

import { useRef, useState, useEffect } from "react";
import { Video } from "@/types/video";
import VideoPlayer from "./VideoPlayer";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface VideoFeedProps {
  videos: Video[];
  onIndexChange?: (index: number) => void;
}

const VideoFeed = ({ videos, onIndexChange }: VideoFeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // For handling window viewport height on mobile
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  // Handle scroll navigation and notify parent of index changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const videoHeight = container.clientHeight;
      const index = Math.round(scrollTop / videoHeight);

      if (index !== currentIndex) {
        setCurrentIndex(index);
        // Notify parent component about index change
        if (onIndexChange) {
          onIndexChange(index);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, onIndexChange]);

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

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll hide-scrollbar snap-y snap-mandatory"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {videos.map((video, index) => (
        <div key={video.id} className="h-full w-full snap-start snap-always">
          <VideoPlayer video={video} isInView={index === currentIndex} />
        </div>
      ))}
    </div>
  );
};

export default VideoFeed;
