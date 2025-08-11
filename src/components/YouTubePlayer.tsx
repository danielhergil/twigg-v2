import React from "react";
import { Play } from "lucide-react";

interface YouTubePlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoUrl, title = "Video", className = "" }) => {
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return (
      <div className={`aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border border-dashed ${className}`}>
        <Play className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Invalid video URL</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Please check the YouTube URL</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden shadow-lg ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        style={{
          border: 'none'
        }}
      />
    </div>
  );
};

export default YouTubePlayer;