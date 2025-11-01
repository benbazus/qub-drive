import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, Maximize, Minimize, RotateCw, Download, Move } from 'lucide-react';
import { toast } from 'sonner';

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
  showControls?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
  showControls = true,
}) => {
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleImageError = useCallback(() => {
    setError('Failed to load image. Please try again or download the file.');
    setIsLoading(false);
    toast.error('Failed to load image');
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 5.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.2));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1.0);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.click();
    toast.success('Download started');
  }, [imageUrl, fileName]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
        e.preventDefault();
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.2, Math.min(5.0, prev + delta)));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleRotate, handleReset]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between gap-2 p-4 bg-gray-100 dark:bg-gray-800 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.2}
              title="Zoom out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm whitespace-nowrap min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 5.0}
              title="Zoom in (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              title="Rotate (R)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              title="Reset view (0)"
            >
              <Move className="h-4 w-4" />
            </Button>

            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Container */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden bg-gray-200 dark:bg-gray-900 flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading image...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <span className="text-2xl">🖼️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to Load Image
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </Button>
            </div>
          </div>
        )}

        {!error && (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={fileName}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`max-w-full max-h-full object-contain transition-transform ${
              isLoading ? 'hidden' : 'block'
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              userSelect: 'none',
              pointerEvents: isDragging ? 'none' : 'auto',
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Help Text */}
      {!error && !isLoading && (
        <div className="p-2 text-center bg-gray-100 dark:bg-gray-800 border-t">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Use mouse wheel to zoom • Drag to pan • Keyboard: +/- (zoom), R (rotate), 0 (reset)
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
