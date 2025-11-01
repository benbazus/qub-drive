


import ShareDialog from '@/components/dialogs/ShareDialog';
//import FilePreviewDialog from '@/components/dialogs/FilePreviewDialog';


import { FileItem } from '@/types/file';
import DownloadDialog from '../dialogs/DownloadDialog';
import MoveDialog from '../dialogs/MoveDialog';
import RenameDialog from '../dialogs/RenameDialog';
import DeleteDialog from '../dialogs/DeleteDialog';
import DetailsDialog from '../dialogs/DetailsDialog';
import LockDialog from '../dialogs/LockDialog';
import StarDialog from '../dialogs/StarDialog';
import CopyLinkDialog from '../dialogs/CopyLinkDialog';
import CopyDialog from '../dialogs/CopyDialog';

// Define the shape of the dialogs state object
interface DialogsState {
  preview: { open: boolean; file: FileItem | null };
  move: { open: boolean; file: FileItem | null };
  share: { open: boolean; file: FileItem | null };
  rename: { open: boolean; file: FileItem | null };
  delete: { open: boolean; file: FileItem | null };
  details: { open: boolean; file: FileItem | null };
  lock: { open: boolean; file: FileItem | null };
  star: { open: boolean; file: FileItem | null };
  copyFile: { open: boolean; file: FileItem | null };
  download: { open: boolean; file: FileItem | null };
  copyLink: { open: boolean; file: FileItem | null };
}

interface DialogManagerProps {
  dialogs: DialogsState;
  closeDialog: (type: keyof DialogsState) => void;
  files?: FileItem[]; // Optional files array for preview navigation
}

export const DialogManager = ({ dialogs, closeDialog }: DialogManagerProps) => {
  return (
    <>
      {/* <FilePreviewDialog
        isOpen={dialogs.preview.open}
        file={dialogs.preview.file}
        files={files}
        initialIndex={dialogs.preview.file ? files.findIndex(f => f.id === dialogs.preview.file?.id) : 0}
        onClose={() => closeDialog('preview')}
      /> */}
      {dialogs.download.file && (
        <DownloadDialog
          isOpen={dialogs.download.open}
          file={dialogs.download.file}
          onClose={() => closeDialog('download')}
        />
      )}
      <MoveDialog
        isOpen={dialogs.move.open}
        file={dialogs.move.file}
        onClose={() => closeDialog('move')}
      />
      <ShareDialog
        isOpen={dialogs.share.open}
        file={dialogs.share.file}
        onClose={() => closeDialog('share')}
      />
      <RenameDialog
        isOpen={dialogs.rename.open}
        file={dialogs.rename.file}
        onClose={() => closeDialog('rename')}
      />
      <DeleteDialog
        isOpen={dialogs.delete.open}
        file={dialogs.delete.file}
        onClose={() => closeDialog('delete')}
      />
      <DetailsDialog
        isOpen={dialogs.details.open}
        file={dialogs.details.file}
        onClose={() => closeDialog('details')}
      />
      <LockDialog
        isOpen={dialogs.lock.open}
        file={dialogs.lock.file}
        onClose={() => closeDialog('lock')}
      />
      <StarDialog
        isOpen={dialogs.star.open}
        file={dialogs.star.file}
        onClose={() => closeDialog('star')}
      />
      <CopyLinkDialog
        isOpen={dialogs.copyLink.open}
        file={dialogs.copyLink.file}
        onClose={() => closeDialog('copyLink')}
      />
      <CopyDialog
        isOpen={dialogs.copyFile.open}
        file={dialogs.copyFile.file}
        onClose={() => closeDialog('copyFile')}
      />
    </>
  );
};