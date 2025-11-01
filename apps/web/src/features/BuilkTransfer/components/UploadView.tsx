import { FC, RefObject, useState } from 'react';
import { Upload, X, Link2, Lock, Calendar, Eye, EyeOff, BarChart3, ChevronDown, Download, AlertCircle } from 'lucide-react';
import { FileMetadata, TransferFormData, AdvancedOptions } from '@/types/transfer.types';
import { Alert, Btn, ProgressBar } from './components';
import { formatFileSize } from '@/utils/formatters';

interface UploadViewProps {
    files: FileMetadata[];
    form: TransferFormData;
    isDragging: boolean;
    error: string;
    advanced: AdvancedOptions;
    uploadProgress: number;
    isUploading: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    onFormChange: (form: TransferFormData) => void;
    onAdvancedChange: (advanced: AdvancedOptions) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (id: number) => void;
    onTransfer: () => void;
    onFileInputClick: () => void;
}

export const UploadView: FC<UploadViewProps> = ({
    files,
    form,
    isDragging,
    error,
    advanced,
    uploadProgress,
    isUploading,
    fileInputRef,
    onFormChange,
    onAdvancedChange,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onRemoveFile,
    onTransfer,
    onFileInputClick
}) => {
    const [emailError, setEmailError] = useState<string>('');

    const getTotalSize = (): string => formatFileSize(files.reduce((sum, f) => sum + f.rawSize, 0));

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (email: string) => {
        onFormChange({ ...form, recipientEmail: email });
        if (email && !validateEmail(email)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handleTransferClick = () => {
        if (!form.recipientEmail) {
            setEmailError('Recipient email is required');
            return;
        }
        if (!validateEmail(form.recipientEmail)) {
            setEmailError('Please enter a valid email address');
            return;
        }
        onTransfer();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Bulk Transfer</h1>
                    <p className="text-white/90">Secure file sharing with advanced features</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={onFileInputClick}
                        className={`border-3 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 mb-6 ${isDragging
                            ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-lg'
                            : 'border-gray-300 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50'
                            }`}
                    >
                        <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                            <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                            <p className="text-2xl font-bold text-gray-800 mb-2">
                                {isDragging ? 'Drop your files here' : 'Upload your files'}
                            </p>
                            <p className="text-gray-600">Click or drag files here to upload</p>
                            <p className="text-sm text-gray-500 mt-2">Up to 2GB per transfer</p>
                        </div>
                        <input ref={fileInputRef} type="file" multiple onChange={onFileSelect} className="hidden" />
                    </div>

                    {error && (
                        <Alert type="error">
                            <p className="text-red-700">{error}</p>
                        </Alert>
                    )}

                    {files.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Files ({files.length}) • {getTotalSize()}
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {files.map(file => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                            <p className="text-sm text-gray-500">{file.size}</p>
                                        </div>
                                        <Btn
                                            onClick={(e: { stopPropagation: () => void; }) => {
                                                e?.stopPropagation();
                                                onRemoveFile(file.id);
                                            }}
                                            className="ml-4 p-2 hover:bg-red-100 rounded-lg text-red-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </Btn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-700">Uploading your files...</span>
                                <span className="font-bold text-indigo-600 text-xl">{uploadProgress}%</span>
                            </div>
                            <ProgressBar progress={uploadProgress} gradient="bg-gradient-to-r from-indigo-500 to-purple-500" />
                        </div>
                    )}

                    {files.length > 0 && !isUploading && (
                        <div className="space-y-4 mb-6">
                            <div className="space-y-3">
                                <textarea
                                    placeholder="Add a message (optional)"
                                    value={form.message}
                                    onChange={(e) => onFormChange({ ...form, message: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none text-sm"
                                />
                                <div>
                                    <input
                                        type="email"
                                        placeholder="Recipient email *"
                                        value={form.recipientEmail}
                                        onChange={(e) => handleEmailChange(e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 transition text-sm ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                        required
                                    />
                                    {emailError && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            {emailError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Btn
                                onClick={() => onAdvancedChange({ ...advanced, showAdvanced: !advanced.showAdvanced })}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-700 text-sm"
                            >
                                <span className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-indigo-600" />
                                    Advanced Security Options
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${advanced.showAdvanced ? 'rotate-180' : ''}`}
                                />
                            </Btn>

                            {advanced.showAdvanced && (
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 space-y-4 border-2 border-indigo-100">
                                    <div>
                                        <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2 text-sm">
                                            <Lock className="w-4 h-4 text-indigo-600" />
                                            Password Protection
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={advanced.showPassword ? 'text' : 'password'}
                                                placeholder="Set a password (optional)"
                                                value={advanced.password}
                                                onChange={(e) => onAdvancedChange({ ...advanced, password: e.target.value })}
                                                className="w-full px-4 py-2.5 pr-12 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                                            />
                                            <Btn
                                                onClick={() =>
                                                    onAdvancedChange({ ...advanced, showPassword: !advanced.showPassword })
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {advanced.showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Btn>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2 text-sm">
                                                <Calendar className="w-4 h-4 text-indigo-600" />
                                                Expires
                                            </label>
                                            <select
                                                value={advanced.expirationDays}
                                                onChange={(e) =>
                                                    onAdvancedChange({ ...advanced, expirationDays: Number(e.target.value) })
                                                }
                                                className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white text-sm"
                                            >
                                                <option value={1}>1 day</option>
                                                <option value={3}>3 days</option>
                                                <option value={7}>7 days</option>
                                                <option value={14}>14 days</option>
                                                <option value={30}>30 days</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2 text-sm">
                                                <Download className="w-4 h-4 text-indigo-600" />
                                                Limit
                                            </label>
                                            <select
                                                value={advanced.downloadLimit || ''}
                                                onChange={(e) =>
                                                    onAdvancedChange({
                                                        ...advanced,
                                                        downloadLimit: e.target.value ? Number(e.target.value) : null
                                                    })
                                                }
                                                className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white text-sm"
                                            >
                                                <option value="">Unlimited</option>
                                                <option value={1}>1</option>
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={advanced.enableTracking}
                                            onChange={(e) =>
                                                onAdvancedChange({ ...advanced, enableTracking: e.target.checked })
                                            }
                                            className="w-4 h-4 text-indigo-600 border-2 border-indigo-300 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                                            <span className="font-semibold text-gray-700 text-sm">Enable Download Tracking</span>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {files.length > 0 && !isUploading && (
                        <Btn
                            onClick={handleTransferClick}
                            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
                        >
                            <Link2 className="w-5 h-5" />
                            Transfer Files
                        </Btn>
                    )}
                </div>

                <div className="mt-8 text-center text-white/90 space-y-2">
                    <p className="text-lg">End-to-end encrypted • Available worldwide</p>
                    <p className="text-sm text-white/70">Files are automatically deleted after expiration</p>
                </div>
            </div>
        </div>
    );
};
