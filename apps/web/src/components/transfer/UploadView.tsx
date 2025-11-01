import { FC, RefObject } from 'react';
import {
    Upload,
    X,
    Lock,
    Calendar,
    Eye,
    EyeOff,
    ChevronDown,
    FileText,
} from 'lucide-react';
import {
    FileMetadata,
    TransferFormData,
    AdvancedOptions,
} from '../../types/transfer.types';

import { Button } from '../ui/button';
import { ProgressBar } from './ProgressBar';
import { Alert } from './Alert';

interface UploadViewProps {
    files: FileMetadata[];
    form: TransferFormData;
    onFormChange: (form: TransferFormData) => void;
    advanced: AdvancedOptions;
    onAdvancedChange: (advanced: AdvancedOptions) => void;
    isDragging: boolean;
    error: string;
    fileInputRef: RefObject<HTMLInputElement>;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (id: number) => void;
    getTotalSize: () => string;
    isUploading: boolean;
    uploadProgress: number;
    onTransfer: () => void;
}

export const UploadView: FC<UploadViewProps> = ({
    files,
    form,
    onFormChange,
    advanced,
    onAdvancedChange,
    isDragging,
    error,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onRemoveFile,
    getTotalSize,
    isUploading,
    uploadProgress,
    onTransfer,
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-2">Bulk Transfer</h1>
                    <p className="text-xl text-white/90">
                        Secure file sharing with advanced features
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
                    {/* Upload Area */}
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-3 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 mb-6 ${isDragging
                            ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-lg'
                            : 'border-gray-300 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50'
                            }`}
                    >
                        <div
                            className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''
                                }`}
                        >
                            <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                            <p className="text-2xl font-bold text-gray-800 mb-2">
                                {isDragging ? 'Drop your files here' : 'Upload your files'}
                            </p>
                            <p className="text-gray-600">
                                Click or drag files here to upload
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Up to 2GB per transfer
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={onFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert type="error">
                            <p className="text-red-700">{error}</p>
                        </Alert>
                    )}

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Files ({files.length}) • {getTotalSize()}
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-gray-500">{file.size}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveFile(file.id);
                                            }}
                                            className="ml-4 p-2 hover:bg-red-100 rounded-lg text-red-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-700">
                                    Uploading your files...
                                </span>
                                <span className="font-bold text-indigo-600 text-xl">
                                    {uploadProgress}%
                                </span>
                            </div>
                            <ProgressBar
                                progress={uploadProgress}
                                gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                        </div>
                    )}

                    {/* Form and Advanced Options */}
                    {files.length > 0 && !isUploading && (
                        <>
                            <div className="space-y-4 mb-6">
                                <input
                                    type="text"
                                    placeholder="Transfer title (optional)"
                                    value={form.title}
                                    onChange={(e) =>
                                        onFormChange({ ...form, title: e.target.value })
                                    }
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />

                                <textarea
                                    placeholder="Add a message (optional)"
                                    value={form.message}
                                    onChange={(e) =>
                                        onFormChange({ ...form, message: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="email"
                                        placeholder="Recipient email (optional)"
                                        value={form.recipientEmail}
                                        onChange={(e) =>
                                            onFormChange({ ...form, recipientEmail: e.target.value })
                                        }
                                        className="px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Your email (optional)"
                                        value={form.senderEmail}
                                        onChange={(e) =>
                                            onFormChange({ ...form, senderEmail: e.target.value })
                                        }
                                        className="px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    />
                                </div>

                                {/* Advanced Options */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-6">
                                    <Button
                                        onClick={() =>
                                            onAdvancedChange({
                                                ...advanced,
                                                showAdvanced: !advanced.showAdvanced,
                                            })
                                        }
                                        className="w-full flex items-center justify-between font-bold text-gray-800 text-lg"
                                    >
                                        Advanced Options
                                        <ChevronDown
                                            className={`w-6 h-6 transition-transform ${advanced.showAdvanced ? 'rotate-180' : ''}`}
                                        />
                                    </Button>

                                    {advanced.showAdvanced && (
                                        <div className="mt-6 space-y-4">
                                            {/* Password */}
                                            <div>
                                                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                                                    <Lock className="w-5 h-5 text-indigo-600" />
                                                    Password (optional)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={
                                                            advanced.showPassword ? 'text' : 'password'
                                                        }
                                                        placeholder="Add a password"
                                                        value={advanced.password}
                                                        onChange={(e) =>
                                                            onAdvancedChange({
                                                                ...advanced,
                                                                password: e.target.value,
                                                            })
                                                        }
                                                        className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                                    />
                                                    <Button
                                                        onClick={() =>
                                                            onAdvancedChange({
                                                                ...advanced,
                                                                showPassword: !advanced.showPassword,
                                                            })
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600"
                                                    >
                                                        {advanced.showPassword ? (
                                                            <EyeOff className="w-5 h-5" />
                                                        ) : (
                                                            <Eye className="w-5 h-5" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Expiration */}
                                            <div>
                                                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                                    Expiration
                                                </label>
                                                <select
                                                    value={advanced.expirationDays}
                                                    onChange={(e) =>
                                                        onAdvancedChange({
                                                            ...advanced,
                                                            expirationDays: parseInt(e.target.value),
                                                        })
                                                    }
                                                    className="w-full px-5 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition"
                                                >
                                                    <option value={1}>1 Day</option>
                                                    <option value={3}>3 Days</option>
                                                    <option value={7}>7 Days (Default)</option>
                                                    <option value={14}>14 Days</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    onClick={onTransfer}
                                    disabled={isUploading || files.length === 0}
                                    className="w-full px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading
                                        ? `Uploading... ${uploadProgress}%`
                                        : 'Create Transfer'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
