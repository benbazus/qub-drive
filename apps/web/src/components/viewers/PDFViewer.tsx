import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, RotateCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
  showControls?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  className = '',
  showControls = true,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again or download the file.');
    setIsLoading(false);
    toast.error('Failed to load PDF');
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
    toast.success('Download started');
  }, [fileUrl, fileName]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between gap-2 p-4 bg-gray-100 dark:bg-gray-800 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm whitespace-nowrap">
              Page {pageNumber} of {numPages || '...'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm whitespace-nowrap">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
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
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 flex items-center justify-center p-4">
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to Load PDF
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        {!error && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="pdf-document"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              }
              className="shadow-lg"
            />
          </Document>
        )}
      </div>

      {/* Page Info */}
      {!error && !isLoading && numPages > 0 && (
        <div className="p-2 text-center bg-gray-100 dark:bg-gray-800 border-t">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {fileName} • {numPages} {numPages === 1 ? 'page' : 'pages'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
