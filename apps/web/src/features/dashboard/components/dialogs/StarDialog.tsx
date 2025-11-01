import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, StarOff, Loader2 } from "lucide-react";
import { FileItem } from "@/types/file";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fileEndPoint } from '@/api/endpoints/file.endpoint';
import { toast } from "sonner";

interface StarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export const useToggleStar = () => {
  const queryClient = useQueryClient();
  return useMutation({

    mutationFn: ({ fileId }: { fileId: string }) => fileEndPoint.star(fileId),
    onSuccess: () => {
      // Invalidate queries to refetch the updated file list.
      queryClient.invalidateQueries({ queryKey: ['files'] });

    },
  });
};


const StarDialog: React.FC<StarDialogProps> = ({ isOpen, onClose, file }) => {
  const toggleStarMutation = useToggleStar();

  // If there's no file, render nothing. This check is crucial.
  if (!file) return null;


  const handleConfirmAction = () => {
    // Ensure we have a file ID before mutating.
    if (!file.id) {
      toast.error("Cannot perform action: File ID is missing.");
      return;
    }

    const actionVerb = !file.starred ? "star" : "un-star";
    const actionPastTense = !file.starred ? "starred" : "un-starred";


    toggleStarMutation.mutate(
      { fileId: file.id },
      {
        onSuccess: () => {
          toast.success(`File "${file.fileName}" has been ${actionPastTense}.`);
          onClose(); // Close the dialog only on success.
        },
        onError: (error) => {
          toast.error(`Failed to ${actionVerb} "${file.fileName}". Please try again.`);
          console.error(`Failed to ${actionVerb} file:`, error);
        },
      }
    );
  };

  const isProcessing = toggleStarMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md"> {/* Sized down for simpler content */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!file.starred ? (
              <Star className="h-5 w-5 text-yellow-500" />
            ) : (
              <StarOff className="h-5 w-5 text-gray-600" />
            )}
            {!file.starred ? `Star "${file.fileName}"` : `Un-star "${file.fileName}"`}
          </DialogTitle>
          <DialogDescription>
            {file.starred
              ? "This will add the file to your starred items for quick access."
              : "Are you sure you want to remove this file from your starred items?"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {file.starred && (
            <Alert variant="destructive">
              <StarOff className="h-4 w-4" />
              <AlertDescription>
                This action will only remove the star. The file itself will not be deleted.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            disabled={isProcessing}
            variant={!file.starred ? "default" : "destructive"}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : file.starred ? (
              <Star className="h-4 w-4 mr-2" />
            ) : (
              <StarOff className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? "Processing..." : !file.starred ? "Add to Starred" : "Remove Star"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StarDialog;