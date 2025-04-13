
import { useEffect } from 'react';
import VideoFeed from '@/components/VideoFeed';
import { mockVideos } from '@/data/mockVideos';

const Index = () => {
  // Forcing dark mode for TikTok-like appearance
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div className="bg-black h-screen w-full max-w-md mx-auto overflow-hidden">
      <VideoFeed videos={mockVideos} />
    </div>
  );
};

export default Index;
