import React, { useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { FileText, FileUp, FolderPlus, Loader2, Upload, Table } from 'lucide-react';
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
import { useFileOperations } from '@/hooks/useFileOperations';
import { toast } from 'sonner';

export function EnhancedButtonAction() {
  const router = useRouter();
  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [createDocumentDialog, setCreateDocumentDialog] = useState(false);
  const [folderName, setFolderName] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');

  const {
    triggerFileUpload,
    createFolder,
    createDocument,
    isCreatingFolder,
    isCreatingDocument,
    isUploading,
  } = useFileOperations({
    onSuccess: (result) => {
      console.log('Operation successful:', result);
    },
    onError: (error) => {
      console.error('Operation failed:', error);
    },
  });

  // Handle file upload
  const handleFileUploadClick = (): void => {
    triggerFileUpload({
      onStart: () => {
        toast.loading('Starting file upload...');
      },
      onProgress: (progress) => {
        // Progress is handled by the service
      },
      onSuccess: (file) => {
        toast.success(`File "${file.fileName}" uploaded successfully!`);
      },
      onError: (error) => {
        toast.error('Upload failed', {
          description: error.message,
        });
      },
    });
  };

  // Handle folder creation
  const handleCreateNewFolder = (): void => {
    setCreateFolderDialog(true);
  };

  const handleConfirmCreateFolder = async (): Promise<void> => {
    if (!folderName.trim()) {
      toast.error('Invalid Folder Name', {
        description: 'Please enter a valid folder name.',
      });
      return;
    }

    try {
      await createFolder(folderName.trim());
      setCreateFolderDialog(false);
      setFolderName('');
    } catch (error) {
      // Error is already handled by the service
    }
  };

  // Handle document creation
  const handleNewDocument = (): void => {
    setCreateDocumentDialog(true);
  };

  const handleConfirmCreateDocument = async (): Promise<void> => {
    if (!documentName.trim()) {
      toast.error('Invalid Document Name', {
        description: 'Please enter a valid document name.',
      });
      return;
    }

    try {
      const document = await createDocument(documentName.trim());
      
      // Navigate to the document editor
      if (document?.id) {
        const url = router.buildLocation({
          to: '/document/$documentId',
          params: { documentId: document.id },
          search: { mode: 'edit' },
        }).href;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      
      setCreateDocumentDialog(false);
      setDocumentName('');
    } catch (error) {
      // Error is already handled by the service
    }
  };

  // Handle spreadsheet creation
  const handleSpreadsheetCreation = (): void => {
    const url = router.buildLocation({ 
      to: '/spreadsheet', 
      search: { token: undefined } 
    }).href;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    toast.success('Spreadsheet Created', {
      description: 'New spreadsheet opened in a new tab.',
    });
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
    <div className="px-3 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-base font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:opacity-50"
            disabled={isUploading || isCreatingFolder || isCreatingDocument}
          >
            {isUploading || isCreatingFolder || isCreatingDocument ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            <span>
              {isUploading ? 'Uploading...' : 
               isCreatingFolder ? 'Creating...' : 
               isCreatingDocument ? 'Creating...' : 
               'Create & Upload'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuItem 
            onClick={handleCreateNewFolder} 
            className="flex items-center gap-2"
            disabled={isCreatingFolder}
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleFileUploadClick} 
            className="flex items-center gap-2"
            disabled={isUploading}
          >
            <FileUp className="h-4 w-4" />
            Upload Files
          </DropdownMenuItem>
          
          <Separator />
          
          <DropdownMenuItem 
            onClick={handleNewDocument} 
            className="flex items-center gap-2"
            disabled={isCreatingDocument}
          >
            <FileText className="h-4 w-4" />
            New Document
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSpreadsheetCreation} 
            className="flex items-center gap-2"
          >
            <Table className="h-4 w-4" />
            New Spreadsheet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Folder Dialog */}
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
                disabled={isCreatingFolder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCreateFolder}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCreateFolder}
              disabled={isCreatingFolder || !folderName.trim()}
            >
              {isCreatingFolder ? (
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

      {/* Create Document Dialog */}
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
                disabled={isCreatingDocument}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCreateDocument}
              disabled={isCreatingDocument}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCreateDocument}
              disabled={isCreatingDocument || !documentName.trim()}
            >
              {isCreatingDocument ? (
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
    </div>
  );
}