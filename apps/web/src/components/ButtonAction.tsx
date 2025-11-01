import React, { useState, useRef, Suspense } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { FileText, FileUp, FolderPlus, FolderUp, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useFolder } from '@/context/folder-context';
import fileEndpoint from '@/api/endpoints/file.endpoint';
import { useTransferManager } from '@/hooks/useTransferManager';
import FileTransferManager from './FileTransferManager';
import { getCurrentParentFolder } from '@/utils/parent-folder.utils';





interface CreateFolderParams {
  name: string;
  parentId?: string;
}

interface CreateDocumentParams {
  name: string;
  parentId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Sidebar Error:', error, errorInfo);
  }

  render(): React.ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function ButtonAction() {
  const { getParentFolder } = useFolder();
  // Use utility function to get parent folder with fallbacks
  const parentId = getCurrentParentFolder(getParentFolder);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [createDocumentDialog, setCreateDocumentDialog] = useState(false);
  const [folderName, setFolderName] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const router = useRouter();
  const queryClient = useQueryClient();
  const transferManager = useTransferManager(); // Singular, as hook name suggests single manager

  const createFolderMutation = useMutation<void, Error, CreateFolderParams>({
    mutationFn: async ({ name, parentId }) => {
      await fileEndpoint.createFolder(name, parentId! ?? null);
    },
    onSuccess: (_, { name }) => {
      toast.success('Folder Created', {
        description: `"${name}" has been created successfully.`,
      });
      setCreateFolderDialog(false);
      setFolderName('');
      queryClient.invalidateQueries({ queryKey: ['all-files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => {
      toast.error('Creation Failed', {
        description: error.message || 'Failed to create folder. Please try again.',
      });
    },
  });

  const createDocumentMutation = useMutation<void, Error, CreateDocumentParams>({
    mutationFn: async ({ name }) => {
      const documentId = uuidv4();          // <- uuid here
      const url = router.buildLocation({
        to: '/document/$documentId',
        params: { documentId },
        search: { mode: 'edit', name },
      }).href;

      window.open(url, '_blank', 'noopener,noreferrer');
    },

    onSuccess: (_, { name }) => {
      toast.success('Document Created', {
        description: `"${name}" has been created successfully.`,
      });
      setCreateDocumentDialog(false);
      setDocumentName('');
    },

    onError: (error) => {
      toast.error('Creation Failed', {
        description: error.message || 'Failed to create document. Please try again.',
      });
    },
  })

  const createSpreadSheetMutation = useMutation<void, Error, CreateDocumentParams>({
    mutationFn: async () => {
      const url = router.buildLocation({ to: '/spreadsheet', search: { token: undefined } }).href;
      window.open(url, '_blank', 'noopener,noreferrer');
    },

    onSuccess: (_, { name }) => {
      toast.success('Document Created', {
        description: `"${name}" has been created successfully.`,
      });
      setCreateDocumentDialog(false);
      setDocumentName('');
    },

    onError: (error) => {
      toast.error('Creation Failed', {
        description: error.message || 'Failed to create document. Please try again.',
      });
    },
  });

  const handleFileUploadClick = (): void => {
    if (!transferManager) {
      toast.error('Transfer Manager Not Available', {
        description: 'File upload functionality is not configured.',
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleUploadFolder = (): void => {
    if (!transferManager) {
      toast.error('Transfer Manager Not Available', {
        description: 'Folder upload functionality is not configured.',
      });
      return;
    }
    folderInputRef.current?.click();
  };

  const handleFolderInputChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0 || !transferManager) return;

    try {
      await transferManager.addFolderForUpload(files);
      toast.success('Folder Upload Started', {
        description: `Uploading folder with ${files.length} file(s)...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Upload Failed', {
        description: errorMessage || 'Failed to start folder upload. Please try again.',
      });
    } finally {
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  const handleCreateNewFolder = (): void => {
    setCreateFolderDialog(true);
  };

  const handleConfirmCreateFolder = (): void => {
    if (!folderName.trim()) {
      toast.error('Invalid Folder Name', {
        description: 'Please enter a valid folder name.',
      });
      return;
    }

    console.log("=== FOLDER CREATION DEBUG ===");
    console.log("parentId from context:", parentId);
    console.log("folderName:", folderName.trim());

    createFolderMutation.mutate({ name: folderName.trim(), parentId: parentId ?? undefined });
  };

  const handleNewDocument = (): void => {
    // setCreateDocumentDialog(true);
    createDocumentMutation.mutate({ name: documentName.trim() });
  };

  const handleSpreadDocument = (): void => {
    createSpreadSheetMutation.mutate({ name: 'New Spreadsheet' });
  };


  const handleConfirmCreateDocument = (): void => {
    if (!documentName.trim()) {
      toast.error('Invalid Document Name', {
        description: 'Please enter a valid document name.',
      });
      return;
    }
    createDocumentMutation.mutate({ name: documentName.trim() });
  };

  const handleCancelCreateFolder = (): void => {
    setCreateFolderDialog(false);
    setFolderName('');
  };

  const handleCancelCreateDocument = (): void => {
    setCreateDocumentDialog(false);
    setDocumentName('');
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-muted-foreground">Unable to load sidebar</p>
        </div>
      }
    >
      <div className="px-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-base font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            >
              <Upload className='h-5 w-5' />
              <span>Upload Files</span>
            </Button>


          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={handleCreateNewFolder} className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFileUploadClick} className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              File Upload
            </DropdownMenuItem>
            <DropdownMenuItem hidden
              onClick={handleUploadFolder}
              className="flex items-center gap-2"
              disabled={!transferManager}
            >
              <FolderUp className="h-4 w-4" />
              Folder Upload
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem onClick={handleNewDocument} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              New Document
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem onClick={handleSpreadDocument} className="flex items-center gap-2 hidden">
              <FileText className="h-4 w-4" />
              New SpreadSheet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="*/*"
        aria-label="File upload input"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error - webkitdirectory is a non-standard property
        webkitdirectory=""
        className="hidden"
        onChange={handleFolderInputChange}
        aria-label="Folder upload input"
      />

      <Dialog open={createFolderDialog} onOpenChange={setCreateFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder to organize your files.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFolderName(e.target.value)}
                className="col-span-3"
                placeholder="Enter folder name"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleConfirmCreateFolder();
                }}
                autoFocus
                disabled={createFolderMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCreateFolder}
              disabled={createFolderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCreateFolder}
              disabled={createFolderMutation.isPending || !folderName.trim()}
            >
              {createFolderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Folder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDocumentDialog} onOpenChange={setCreateDocumentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Enter a name for your new document. It will open in edit mode after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document-name" className="text-right">
                Name
              </Label>
              <Input
                id="document-name"
                value={documentName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentName(e.target.value)}
                className="col-span-3"
                placeholder="Enter document name"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleConfirmCreateDocument();
                }}
                autoFocus
                disabled={createDocumentMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCreateDocument}
              disabled={createDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCreateDocument}
              disabled={createDocumentMutation.isPending || !documentName.trim()}
            >
              {createDocumentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<div>Loading transfer manager...</div>}>
        <FileTransferManager
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          folderInputRef={folderInputRef as React.RefObject<HTMLInputElement>}
        />
      </Suspense>
    </ErrorBoundary>
  );
}