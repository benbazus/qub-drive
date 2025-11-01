// import React from 'react';
// import { FileItem } from '@/types/file';
// import { PreviewModal } from './PreviewModal';

// // Legacy function for backward compatibility
// export function isPreviewable(fileName: string): boolean {
//     const extension = fileName?.split('.').pop()?.toLowerCase();
//     return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt', 'pdf', 'md'].includes(extension || '');
// }

// interface FilePreviewDialogProps {
//     isOpen: boolean;
//     onClose: () => void;
//     file: FileItem | null;
//     files?: FileItem[]; // Enhanced to support multiple files
//     initialIndex?: number; // Enhanced to support initial file index
// }

// const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({ 
//     isOpen, 
//     onClose, 
//     file, 
//     files = [], 
//     initialIndex = 0 
// }) => {
//     // Use the new enhanced PreviewModal component
//     if (file) {
//         return (
//             <PreviewModal
//                 isOpen={isOpen}
//                 onClose={onClose}
//                 fileId={file.id}
//                 files={files}
//                 initialIndex={initialIndex}
//             />
//         );
//     }

//     return null;
// };

// export default FilePreviewDialog;