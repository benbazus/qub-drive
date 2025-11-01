/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, Key, useState } from 'react';
import { Link2, Check, Copy, Lock, BarChart3, Download } from 'lucide-react';
import { Alert, Btn } from './components';
import { FileMetadata, AdvancedOptions } from '@/types/transfer.types';
import { formatFileSize, getExpirationDate, getFullShareLink } from '@/utils/formatters';

interface SuccessViewProps {
    shareLink: string;
    files: FileMetadata[];
    advanced: AdvancedOptions;
    statsData: any;
    onReset: () => void;
    onSwitchToDownloadView: () => void;
}

export const SuccessView: FC<SuccessViewProps> = ({
    shareLink,
    files,
    advanced,
    statsData,
    onReset,

}) => {
    const [copied, setCopied] = useState<boolean>(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getFullShareLink(shareLink));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getTotalSize = (): string => formatFileSize(files.reduce((sum, f) => sum + f.rawSize, 0));

    const fullShareLink = getFullShareLink(shareLink);
    const stats = statsData?.data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-white text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Check className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-bold mb-2">Transfer Complete!</h2>
                    <p className="text-green-50">Your files are ready to share</p>
                </div>

                <div className="p-8">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Link2 className="w-5 h-5 text-indigo-600" />
                            <p className="font-semibold text-gray-700">Share Link</p>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={fullShareLink}
                                readOnly
                                className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white font-mono text-sm"
                            />
                            <Btn
                                onClick={copyToClipboard}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </Btn>
                        </div>

                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Files</p>
                            <p className="text-2xl font-bold text-gray-800">{files.length}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Total Size</p>
                            <p className="text-2xl font-bold text-gray-800">{getTotalSize()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Expires</p>
                            <p className="text-lg font-semibold text-gray-800">
                                {getExpirationDate(advanced.expirationDays)}
                            </p>
                        </div>
                        {advanced.downloadLimit && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Download Limit</p>
                                <p className="text-2xl font-bold text-gray-800">{advanced.downloadLimit}</p>
                            </div>
                        )}
                    </div>

                    {advanced.password && (
                        <Alert type="warning">
                            <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-amber-900 mb-1">Password Protected</p>
                                <p className="text-sm text-amber-700">Recipients will need the password to download</p>
                            </div>
                        </Alert>
                    )}

                    {advanced.enableTracking && stats && (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 my-6 border border-blue-100">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-gray-800 text-lg">Download Analytics</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.totalDownloads}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Unique Users</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.uniqueDownloaders}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="text-sm text-gray-600 mb-1">Last Download</p>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {stats.lastDownload
                                            ? new Date(stats.lastDownload).toLocaleTimeString()
                                            : 'None yet'}
                                    </p>
                                </div>
                            </div>
                            {stats.downloads.length > 0 && (
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <p className="font-semibold text-gray-700 mb-3">Recent Activity</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {stats.downloads.map((dl: { id: Key | null | undefined; location: any; ipAddress: any; downloadedAt: string | number | Date; }) => (
                                            <div
                                                key={dl.id}
                                                className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Download className="w-4 h-4 text-blue-500" />
                                                    <span className="text-gray-700">{dl.location || dl.ipAddress}</span>
                                                </div>
                                                <span className="text-gray-500">
                                                    {new Date(dl.downloadedAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Btn
                        onClick={onReset}
                        className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg hover:shadow-xl hidden"
                    >
                        Send Another Transfer
                    </Btn>
                </div>
            </div>
        </div>
    );
};
