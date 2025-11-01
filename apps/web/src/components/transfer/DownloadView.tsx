import { FC, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Download, AlertCircle, Lock, FileText } from 'lucide-react';
import { TransferData } from '../../types/transfer.types';
import { formatFileSize, getDaysRemaining, isTransferExpired } from '../../utils/formatters';

import { Button } from '../ui/button';
import { ProgressBar } from './ProgressBar';
import { Alert } from './Alert';

interface DownloadViewProps {
    isLoading: boolean;
    transferData?: TransferData['data'];
    fetchError: string | null;
    onDownloadFile: (fileId: string, fileName: string) => void;
    isDownloading: boolean;
    downloadProgress: number;
    downloadErrorMsg: string | null;
    enteredPassword: string;
    onPasswordChange: (value: string) => void;
    passwordError: boolean;
    onReset: () => void;
}

export const DownloadView: FC<DownloadViewProps> = ({
    isLoading,
    transferData,
    fetchError,
    onDownloadFile,
    isDownloading,
    downloadProgress,
    downloadErrorMsg,
    enteredPassword,
    onPasswordChange,
    passwordError,
    onReset
}) => {
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (fetchError || !transferData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
                <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{fetchError}</p>
                    <Button onClick={onReset} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const daysRemaining = getDaysRemaining(transferData.expirationDate);
    const isExpired = isTransferExpired(transferData.expirationDate);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8 text-white text-center">
                    <Download className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Download Files</h1>
                    <p className="text-blue-50">
                        {transferData.senderEmail
                            ? `Sent by ${transferData.senderEmail}`
                            : 'Someone shared files with you'}
                    </p>
                </div>

                <div className="p-8">
                    {transferData.title && (
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">{transferData.title}</h2>
                    )}
                    {transferData.message && (
                        <Alert type="info">
                            <p className="text-gray-700">{transferData.message}</p>
                        </Alert>
                    )}

                    <div className="my-6">
                        <h3 className="font-semibold text-gray-700 mb-3">
                            Files ({transferData.files.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {transferData.files.map((file: { id: Key | null | undefined; fileName: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; fileSize: number; }) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{file.fileName}</p>
                                            <p className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => onDownloadFile(file.id, file.fileName)}
                                        disabled={isDownloading || isExpired}
                                        className={`ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isDownloading || isExpired ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        <Download className="w-4 h-4" />
                                        {isDownloading ? 'Downloading...' : 'Download'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 text-center mt-3">
                            Total size:{' '}
                            <span className="font-semibold">{formatFileSize(transferData.totalSize)}</span>
                        </p>
                    </div>

                    {!isExpired && daysRemaining <= 2 && (
                        <Alert type="warning">
                            <p className="font-semibold text-amber-900">Expiring Soon!</p>
                            <p className="text-sm text-amber-700">
                                This transfer expires in {daysRemaining}{' '}
                                {daysRemaining === 1 ? 'day' : 'days'}
                            </p>
                        </Alert>
                    )}

                    {transferData.hasPassword && (
                        <div className="my-6">
                            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Password Required
                            </label>
                            <input
                                type="password"
                                placeholder="Enter password to download"
                                value={enteredPassword}
                                onChange={(e) => onPasswordChange(e.target.value)}
                                className={`w-full px-5 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition ${passwordError ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {passwordError && (
                                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Incorrect password
                                </p>
                            )}
                        </div>
                    )}

                    {isDownloading && (
                        <div className="my-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-700">Downloading...</span>
                                <span className="font-bold text-blue-600 text-xl">{downloadProgress}%</span>
                            </div>
                            <ProgressBar
                                progress={downloadProgress}
                                gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
                            />
                        </div>
                    )}

                    {isExpired && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-900 mb-2">Transfer Expired</h3>
                            <p className="text-red-700">
                                This transfer has expired and is no longer available.
                            </p>
                        </div>
                    )}

                    {downloadErrorMsg && (
                        <Alert type="error">
                            <p className="text-red-700">{downloadErrorMsg}</p>
                        </Alert>
                    )}

                    <div className="mt-6 text-center">
                        <Button
                            onClick={onReset}
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            ← Create Your Own Transfer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
