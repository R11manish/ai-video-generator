
import { useState, useRef, useEffect } from 'react';

interface UseVideoPlayerProps {
  isInView: boolean;
}

export const useVideoPlayer = ({ isInView }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isInView) {
      videoElement.play().catch(error => {
        console.error('Autoplay failed:', error);
      });
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [isInView]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateProgress = () => {
      if (videoElement.duration) {
        const percentage = (videoElement.currentTime / videoElement.duration) * 100;
        setProgress(percentage);
      }
    };

    videoElement.addEventListener('timeupdate', updateProgress);

    return () => {
      videoElement.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play().catch(error => {
        console.error('Play failed:', error);
      });
      setIsPlaying(true);
    }
  };

  const toggleLike = () => {
    setIsLiked(prev => !prev);
  };

  return {
    videoRef,
    isPlaying,
    progress,
    isLiked,
    togglePlay,
    toggleLike
  };
};
