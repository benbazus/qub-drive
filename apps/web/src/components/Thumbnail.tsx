import React, { useState, useEffect } from 'react';
import { getFileIcon } from '@/features/dashboard/components/fileUtils';
import { fileEndPoint } from '@/api/endpoints/file.endpoint';
import { useAuthStore } from '@/stores/authStore';


interface ThumbnailProps {
  fileId: string;
  mimeType: string;
  fileName: string;
  className?: string;
  fallbackIcon?: boolean;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  fileId,
  mimeType,
  fileName,
  className = "w-6 h-6",
  fallbackIcon = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailBlob, setThumbnailBlob] = useState<string | null>(null);

  // Check if the file type supports thumbnails (images, videos, etc.)
  const supportsThumbnail = mimeType?.startsWith('image/') ||
    mimeType?.startsWith('video/') ||
    mimeType === 'application/pdf';

  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!supportsThumbnail || !accessToken) {
      setIsLoading(false);
      return;
    }

    const fetchThumbnail = async () => {
      try {
        const thumbnailUrl = fileEndPoint.getThumbnailUrl(fileId);

        // Use the apiClient to make the request (it handles auth headers automatically)
        const response = await fetch(`http://localhost:5001/api/files/${thumbnailUrl}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setThumbnailBlob(blobUrl);
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.error('Error fetching thumbnail:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThumbnail();

    // Cleanup blob URL on unmount
    return () => {
      if (thumbnailBlob) {
        URL.revokeObjectURL(thumbnailBlob);
      }
    };
  }, [fileId, supportsThumbnail, accessToken]);

  // const handleImageLoad = () => {
  //   setIsLoading(false);
  // };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // If file doesn't support thumbnails or there was an error, show icon
  if (!supportsThumbnail || (imageError && !thumbnailBlob)) {
    return fallbackIcon ? (
      <div className={className}>
        {getFileIcon(mimeType)}
      </div>
    ) : null;
  }

  // Show loading state
  if (isLoading || !thumbnailBlob) {
    return (
      <div className={`relative ${className}`}>
        <div className={`absolute inset-0 flex items-center justify-center bg-muted/50 rounded ${className}`}>
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        {fallbackIcon && (
          <div className={`opacity-30 ${className}`}>
            {getFileIcon(mimeType)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Thumbnail image */}
      <img
        src={thumbnailBlob}
        alt={`Thumbnail for ${fileName}`}
        className={`object-cover rounded ${className} transition-opacity duration-200`}
        onError={handleImageError}
        loading="lazy"
      />

      {/* Fallback icon overlay if needed */}
      {imageError && fallbackIcon && (
        <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
          {getFileIcon(mimeType)}
        </div>
      )}
    </div>
  );
};

export default Thumbnail;