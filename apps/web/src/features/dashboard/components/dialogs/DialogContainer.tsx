import CopyDialog from "./CopyDialog"
import CopyLinkDialog from "./CopyLinkDialog"
import DeleteDialog from "./DeleteDialog"
import DetailsDialog from "./DetailsDialog"
import LockDialog from "./LockDialog"
import MoveDialog from "./MoveDialog"
import PreviewDialog from "./PreviewDialog"
import RenameDialog from "./RenameDialog"
import ShareDialog from "./ShareDialog"
import StarDialog from "./StarDialog"
import { FileItem } from '@/types/file'

interface DialogContainerProps {

    dialogs: {
        preview: { open: boolean; file: FileItem | null }
        move: { open: boolean; file: FileItem | null }
        share: { open: boolean; file: FileItem | null }
        rename: { open: boolean; file: FileItem | null }
        delete: { open: boolean; file: FileItem | null }
        details: { open: boolean; file: FileItem | null }
        lock: { open: boolean; file: FileItem | null }
        star: { open: boolean; file: FileItem | null }
        copyFile: { open: boolean; file: FileItem | null }
        copyLink: { open: boolean; file: FileItem | null }
    }
    onCloseDialog: (type: string) => void
}

const DialogContainer = ({ dialogs, onCloseDialog }: DialogContainerProps) => {
    return (
        <>
            {/* All Dialogs */}
            <PreviewDialog
                isOpen={dialogs.preview.open}
                file={dialogs.preview.file}
                onClose={() => onCloseDialog('preview')}
            />
            <MoveDialog
                isOpen={dialogs.move.open}
                file={dialogs.move.file}
                onClose={() => onCloseDialog('move')}
            />
            <ShareDialog
                isOpen={dialogs.share.open}
                file={dialogs.share.file}
                onClose={() => onCloseDialog('share')}
            />
            <RenameDialog
                isOpen={dialogs.rename.open}
                file={dialogs.rename.file}
                onClose={() => onCloseDialog('rename')}
            />
            <DeleteDialog
                isOpen={dialogs.delete.open}
                file={dialogs.delete.file}
                onClose={() => onCloseDialog('delete')}
            />
            <DetailsDialog
                isOpen={dialogs.details.open}
                file={dialogs.details.file}
                onClose={() => onCloseDialog('details')}
            />
            <LockDialog
                isOpen={dialogs.lock.open}
                onClose={() => onCloseDialog('lock')}
                file={dialogs.lock.file}
            />
            <StarDialog
                isOpen={dialogs.star.open}
                onClose={() => onCloseDialog('star')}
                file={dialogs.star.file}
            />
            <CopyLinkDialog
                isOpen={dialogs.copyLink.open}
                onClose={() => onCloseDialog('copyLink')}
                file={dialogs.copyLink.file}
            />
            <CopyDialog
                isOpen={dialogs.copyFile.open}
                onClose={() => onCloseDialog('copyFile')}
                file={dialogs.copyFile.file}
            />
        </>
    )
}

export default DialogContainer