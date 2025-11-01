/* eslint-disable no-console */
import { useState, useRef, useEffect, FC } from 'react';
import {
    FileMetadata,
    TransferFormData,
    AdvancedOptions,
    ViewType
} from '@/types/transfer.types';
import {
    useCreateTransfer,
    useFetchDownloadStats
} from '@/hooks/useTransfer';
import { useNavigate } from '@tanstack/react-router';
import { formatFileSize } from '@/utils/formatters';
import { SuccessView } from './components/SuccessView';
import { UploadView } from './components/UploadView';

function generateBrowserRandomId(bytes = 16) {
    const buffer = new Uint8Array(bytes);
    window.crypto.getRandomValues(buffer);

    // Convert the byte array to a hex string
    const hexString = Array.from(buffer, byte => {
        return byte.toString(16).padStart(2, '0');
    }).join('');

    return hexString;
}

const BuilkTransfer: FC = () => {
    const [view, setView] = useState<ViewType>('upload');
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [form, setForm] = useState<TransferFormData>({ message: '', recipientEmail: '' });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [shareLink, setShareLink] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [advanced, setAdvanced] = useState<AdvancedOptions>({
        password: '',
        showPassword: false,
        expirationDays: 7,
        downloadLimit: null,
        enableTracking: false,
        showAdvanced: false
    });
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // React Query hooks
    const { createTransferAsync, uploadProgress, isPending: isUploading, isSuccess: uploadSuccess } = useCreateTransfer();

    const { data: statsData } = useFetchDownloadStats(shareLink, {
        enabled: view === 'success' && advanced.enableTracking && !!shareLink
    });

    // File handling
    const addFiles = (newFiles: File[]) => {
        const filesWithMeta: FileMetadata[] = newFiles.map((file, idx) => ({
            id: Date.now() + idx,
            file,
            name: file.name,
            size: formatFileSize(file.size),
            rawSize: file.size,
            type: file.type || 'unknown'
        }));
        setFiles([...files, ...filesWithMeta]);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (id: number) => setFiles(files.filter(f => f.id !== id));

    // Transfer handling
    const handleTransfer = async () => {
        if (!files.length) return;
        setError('');

        try {
            const shareLink = generateBrowserRandomId(16);

            const response = await createTransferAsync({
                files: files.map(f => f.file),
                message: form.message || undefined,
                recipientEmail: form.recipientEmail || undefined,
                password: advanced.password || undefined,
                expirationDays: advanced.expirationDays,
                downloadLimit: advanced.downloadLimit || undefined,
                trackingEnabled: advanced.enableTracking,
                shareLink: shareLink
            });

            console.log(" RRRRRRRRRRRRRRRRRRRRRRRR ")
            console.log(response)
            console.log(" RRRRRRRRRRRRRRRRRRRRRRRRR ")

            setShareLink(response.data.shareLink);
            setView('success');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload files. Please try again.');
        }
    };

    const resetTransfer = () => {
        setView('upload');
        setFiles([]);
        setForm({ message: '', recipientEmail: '' });
        setShareLink('');
        setAdvanced({
            password: '',
            showPassword: false,
            expirationDays: 7,
            downloadLimit: null,
            enableTracking: false,
            showAdvanced: false
        });
        setError('');
        navigate({ to: '/dashboard/BuilkTransfer' });
    };

    const switchToDownloadView = () => {
        setView('download');
    };

    // Check URL for share link on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const share = params.get('share');
        if (share) {
            setShareLink(share);
            setView('download');
        }
    }, []);

    // Handle upload success
    useEffect(() => {
        if (uploadSuccess && view !== 'success') {
            setView('success');
        }
    }, [uploadSuccess, view]);

    // // DOWNLOAD VIEW
    // if (view === 'download') {
    //     return (
    //         <DownloadView
    //             transferData={transferData}
    //             shareLink={shareLink}
    //             isLoadingTransfer={isLoadingTransfer}
    //             transferError={transferError}

    //         />
    //     );
    // }

    // SUCCESS VIEW
    if (view === 'success') {
        return (
            <SuccessView
                shareLink={shareLink}
                files={files}
                advanced={advanced}
                statsData={statsData}
                onReset={resetTransfer}
                onSwitchToDownloadView={switchToDownloadView}
            />
        );
    }

    // UPLOAD VIEW
    return (
        <UploadView
            files={files}
            form={form}
            isDragging={isDragging}
            error={error}
            advanced={advanced}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            onFormChange={setForm}
            onAdvancedChange={setAdvanced}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onRemoveFile={removeFile}
            onTransfer={handleTransfer}
            onFileInputClick={() => fileInputRef.current?.click()}
        />
    );
};

export default BuilkTransfer;
