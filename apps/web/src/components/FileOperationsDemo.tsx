import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FolderPlus, 
  FileText, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  File,
  Folder
} from 'lucide-react';
import { useFileOperations } from '@/hooks/useFileOperations';
import { toast } from 'sonner';

export const FileOperationsDemo: React.FC = () => {
  const [folderName, setFolderName] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [operationStatus, setOperationStatus] = useState<{
    type: 'upload' | 'folder' | 'document' | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ type: null, status: 'idle' });

  const {
    triggerFileUpload,
    createFolder,
    createDocument,
    uploadFile,
    validateFile,
    isUploading,
    isCreatingFolder,
    isCreatingDocument,
    currentFolder,
  } = useFileOperations({
    onSuccess: (result) => {
      setOperationStatus({
        type: operationStatus.type,
        status: 'success',
        message: 'Operation completed successfully!',
      });
      setTimeout(() => {
        setOperationStatus({ type: null, status: 'idle' });
      }, 3000);
    },
    onError: (error) => {
      setOperationStatus({
        type: operationStatus.type,
        status: 'error',
        message: error.message,
      });
      setTimeout(() => {
        setOperationStatus({ type: null, status: 'idle' });
      }, 5000);
    },
  });

  const handleFileUpload = () => {
    setOperationStatus({ type: 'upload', status: 'loading' });
    setUploadProgress(0);
    
    triggerFileUpload({
      onStart: () => {
        toast.loading('Starting file upload...');
      },
      onProgress: (progress) => {
        setUploadProgress(progress.percentage);
      },
      onSuccess: (file) => {
        setUploadProgress(100);
        toast.success(`File uploaded successfully!`);
      },
      onError: (error) => {
        toast.error('Upload failed', {
          description: error.message,
        });
      },
    }, {
      multiple: true,
      accept: '*/*',
    });
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setOperationStatus({ type: 'folder', status: 'loading' });
    
    try {
      await createFolder(folderName.trim());
      setFolderName('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreateDocument = async () => {
    if (!documentName.trim()) {
      toast.error('Please enter a document name');
      return;
    }

    setOperationStatus({ type: 'document', status: 'loading' });
    
    try {
      await createDocument(documentName.trim(), {
        pageFormat: 'A4',
        marginSize: 'normal',
        fontSize: 12,
        fontFamily: 'Arial',
      });
      setDocumentName('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setOperationStatus({ type: 'upload', status: 'loading' });
    setUploadProgress(0);

    // Upload files one by one
    files.forEach(async (file) => {
      // Validate file
      const validation = validateFile(file, {
        maxSize: 100 * 1024 * 1024, // 100MB
        blockedTypes: ['exe', 'bat', 'cmd'],
      });

      if (!validation.valid) {
        toast.error(`Invalid file: ${file.name}`, {
          description: validation.error,
        });
        return;
      }

      try {
        await uploadFile(file, {
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
          },
          onSuccess: (uploadedFile) => {
            toast.success(`${file.name} uploaded successfully!`);
          },
          onError: (error) => {
            toast.error(`Failed to upload ${file.name}`, {
              description: error.message,
            });
          },
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    });
  };

  const getStatusIcon = () => {
    switch (operationStatus.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (operationStatus.status) {
      case 'loading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            File Operations Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Demonstrate file upload, folder creation, and document creation functionality
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Folder Info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Folder className="h-4 w-4" />
            <span className="text-sm">
              Current Folder: <Badge variant="outline">{currentFolder || 'Root'}</Badge>
            </span>
          </div>

          {/* Status Display */}
          {operationStatus.status !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {operationStatus.message || `${operationStatus.type} operation in progress...`}
              </span>
            </div>
          )}

          {/* Upload Progress */}
          {(isUploading || uploadProgress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag and Drop Area */}
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleFileUpload}
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drop files here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports multiple files, max 100MB each
                </p>
              </div>

              <Button 
                onClick={handleFileUpload} 
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select Files to Upload
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Folder Creation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Create Folder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  disabled={isCreatingFolder}
                />
              </div>
              <Button 
                onClick={handleCreateFolder} 
                disabled={isCreatingFolder || !folderName.trim()}
                className="w-full"
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Folder...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Folder
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Document Creation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Create Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-name">Document Name</Label>
                <Input
                  id="document-name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Enter document name"
                  disabled={isCreatingDocument}
                />
              </div>
              <Button 
                onClick={handleCreateDocument} 
                disabled={isCreatingDocument || !documentName.trim()}
                className="w-full"
              >
                {isCreatingDocument ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Document...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};