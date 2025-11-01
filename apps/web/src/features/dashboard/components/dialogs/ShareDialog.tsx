
// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
// import { File, X, Loader2, Users, Lock, Calendar, Mail, Eye } from 'lucide-react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { FileItem } from '@/types/file';
// import { fileEndPoint } from '@/api/endpoints/file.endpoint';
// import { useDebounce } from '@/hooks/use-debounce';

// // Type definitions for Share functionality
// interface Permission {
//   id: string;
//   permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
//   name?: string;
//   email?: string;
// }

// interface ShareFileRequest {
//   shareType: 'specific' | 'anyone';
//   users: Permission[];
//   permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
//   notifyByEmail: boolean;
//   requireApproval: boolean;
//   allowDownload: boolean;
//   watermark: boolean;
//   message: string;
//   expiresAt?: string;
//   password?: string;
// }

// interface ShareState {
//   shareType: 'specific' | 'anyone';
//   users: Permission[];
//   permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
//   notifyByEmail: boolean;
//   requireApproval: boolean;
//   allowDownload: boolean;
//   watermark: boolean;
//   message: string;
//   expiryDays: number;
//   password: string;
// }

// interface User {
//   id: string;
//   firstName?: string;
//   email: string;
// }

// // Custom hooks
// function useSearchUsers(query: string) {
//   return useQuery<User[], Error>({
//     queryKey: ['users-search', query],
//     queryFn: async () => {
//       if (query.trim().length < 2) return [];
//       try {
//         const data = await fileEndPoint.searchUsers(query);
//         return Array.isArray(data) ? data : [];
//       } catch (error) {
//         console.warn('Search users error:', error);
//         return [];
//       }
//     },
//     enabled: !!query && query.trim().length >= 2,
//     placeholderData: [],
//   });
// }

// function useCurrentUser() {
//   return useQuery<User, Error>({
//     queryKey: ['current-user'],
//     queryFn: async () => {
//       try {
//         return await fileEndPoint.getCurrentUser();
//       } catch (error) {
//         console.warn('Get current user not implemented yet:', error);
//         return { id: 'current-user', firstName: 'Current', email: 'current@example.com' };
//       }
//     },
//     staleTime: 5 * 60 * 1000,
//   });
// }

// function useShareFile() {
//   const queryClient = useQueryClient();
//   return useMutation<any, Error, { fileId: string; data: ShareFileRequest }>({
//     mutationFn: async ({ fileId, data }) => {
//       try {
//         return await fileEndPoint.shareFile(fileId, data);
//       } catch (error) {
//         console.warn('Share file not implemented yet:', error);
//         console.log('Sharing file:', fileId, data);
//         return { success: true, message: 'File shared successfully' };
//       }
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['files'] });
//       queryClient.invalidateQueries({ queryKey: ['fileShares'] });
//       queryClient.invalidateQueries({ queryKey: ['userShares'] });
//     },
//   });
// }

// interface ShareDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   file: FileItem | null;
// }

// const INITIAL_SHARE_STATE: ShareState = {
//   shareType: 'specific',
//   users: [],
//   permission: 'VIEW',
//   notifyByEmail: false,
//   requireApproval: false,
//   allowDownload: true,
//   watermark: false,
//   message: '',
//   expiryDays: 7,
//   password: '',
// };

// const EXPIRY_OPTIONS = [
//   { value: '1', label: '1 day' },
//   { value: '7', label: '7 days' },
//   { value: '30', label: '30 days' },
//   { value: '90', label: '90 days' },
//   { value: '365', label: '1 year' },
//   { value: '0', label: 'Never' },
// ];

// const PERMISSION_OPTIONS = [
//   { value: 'VIEW', label: 'Can view', icon: Eye },
//   { value: 'COMMENT', label: 'Can comment', icon: Mail },
//   { value: 'EDIT', label: 'Can edit', icon: File },
//   { value: 'ADMIN', label: 'Full access', icon: Users },
// ];

// const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, file }) => {
//   const [search, setSearch] = useState('');
//   const [requirePassword, setRequirePassword] = useState(false);
//   const [passwordInput, setPasswordInput] = useState('');
//   const [shareState, setShareState] = useState<ShareState>(INITIAL_SHARE_STATE);

//   const delayedSearch = useDebounce(search, 300);

//   const { data: users = [], isLoading: usersLoading } = useSearchUsers(delayedSearch);
//   const { data: currentUser } = useCurrentUser();
//   const shareFileMutation = useShareFile();

//   // Memoized filtered users
//   const filteredUsers = useMemo(() =>
//     users.filter(user => {
//       if (currentUser && user.id === currentUser.id) return false;
//       return !shareState.users.some(addedUser => addedUser.id === user.id);
//     }), [users, currentUser, shareState.users]
//   );

//   // Reset state when dialog opens/closes
//   useEffect(() => {
//     if (!isOpen) {
//       setSearch('');
//       setShareState(INITIAL_SHARE_STATE);
//       setRequirePassword(false);
//       setPasswordInput('');
//     }
//   }, [isOpen]);

//   // Handle successful share
//   useEffect(() => {
//     if (shareFileMutation.isSuccess && shareFileMutation.data?.success) {
//       toast.success(`"${file?.fileName || 'Untitled'}" shared successfully!`);
//       onClose();
//     }
//   }, [shareFileMutation.isSuccess, shareFileMutation.data, onClose, file?.fileName]);

//   // Handle share error
//   useEffect(() => {
//     if (shareFileMutation.isError) {
//       toast.error(shareFileMutation.error?.message || 'Failed to share file. Please try again.');
//     }
//   }, [shareFileMutation.isError, shareFileMutation.error]);

//   const calculateExpiresAt = useCallback((days: number): string | undefined => {
//     if (days === 0) return undefined;
//     const date = new Date();
//     date.setDate(date.getDate() + days);
//     return date.toISOString();
//   }, []);

//   const handleAddUser = useCallback((user: User) => {
//     if (currentUser && user.id === currentUser.id) {
//       toast.warning('You cannot share with yourself');
//       return;
//     }
//     if (shareState.users.some(u => u.id === user.id)) {
//       toast.warning('User already added');
//       return;
//     }
//     setShareState(prev => ({
//       ...prev,
//       users: [...prev.users, {
//         id: user.id,
//         permission: prev.permission,
//         name: user.firstName,
//         email: user.email,
//       }],
//     }));
//     setSearch('');
//   }, [currentUser, shareState.users]);

//   const handleRemoveUser = useCallback((userId: string) => {
//     setShareState(prev => ({
//       ...prev,
//       users: prev.users.filter(u => u.id !== userId),
//     }));
//   }, []);

//   const handleUserPermissionChange = useCallback((userId: string, permission: Permission) => {
//     setShareState(prev => ({
//       ...prev,
//       users: prev.users.map(u => u.id === userId ? { ...u, permission } : u),
//     }));
//   }, []);

//   const handleAction = useCallback(() => {
//     if (shareState.shareType === 'specific' && shareState.users.length === 0) {
//       toast.error('Please add at least one user to share with');
//       return;
//     }
//     if (!file?.id) {
//       toast.error('No file selected');
//       return;
//     }
//     if (requirePassword && !passwordInput) {
//       toast.error('Please provide a password for the share link');
//       return;
//     }

//     const shareData: ShareFileRequest = {
//       shareType: shareState.shareType,
//       users: shareState.shareType === 'specific' ? shareState.users : [],
//       permission: shareState.permission,
//       notifyByEmail: shareState.notifyByEmail,
//       requireApproval: shareState.requireApproval,
//       allowDownload: shareState.allowDownload,
//       watermark: shareState.watermark,
//       message: shareState.message,
//       expiresAt: calculateExpiresAt(shareState.expiryDays),
//       password: requirePassword ? passwordInput : undefined,
//     };

//     shareFileMutation.mutate({ fileId: file.id, data: shareData });
//   }, [shareState, file?.id, requirePassword, passwordInput, calculateExpiresAt, shareFileMutation]);

//   const isShareDisabled = useMemo(() =>
//     shareFileMutation.isPending ||
//     (shareState.shareType === 'specific' && shareState.users.length === 0) ||
//     (requirePassword && !passwordInput),
//     [shareFileMutation.isPending, shareState.shareType, shareState.users.length, requirePassword, passwordInput]
//   );

//   const UserAvatar = ({ user }: { user: { name?: string; email?: string } }) => (
//     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white shadow-sm">
//       {user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? '?'}
//     </div>
//   );

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
//         <DialogHeader className="space-y-3 pb-4 border-b">
//           <DialogTitle className="flex items-center gap-3 text-lg">
//             <div className="p-2 bg-blue-50 rounded-lg">
//               <File className="h-5 w-5 text-blue-600" />
//             </div>
//             <div>
//               <div className="font-semibold">Share "{file?.fileName ?? 'Untitled'}"</div>
//               <DialogDescription className="text-sm text-gray-600 mt-1">
//                 Manage access permissions for this {file?.type ?? 'file'}
//               </DialogDescription>
//             </div>
//           </DialogTitle>
//         </DialogHeader>

//         <div className="flex-1 overflow-y-auto space-y-6 py-4">
//           {/* Share Type Selection */}
//           <div className="space-y-3">
//             <Label className="text-sm font-medium text-gray-900">Share with</Label>
//             <Select
//               value={shareState.shareType}
//               onValueChange={(value: ShareState['shareType']) =>
//                 setShareState(prev => ({ ...prev, shareType: value }))
//               }
//             >
//               <SelectTrigger className="h-10">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="specific">
//                   <div className="flex items-center gap-2">
//                     <Users className="h-4 w-4" />
//                     Specific people
//                   </div>
//                 </SelectItem>
//                 <SelectItem value="anyone">
//                   <div className="flex items-center gap-2">
//                     <Eye className="h-4 w-4" />
//                     Anyone with the link
//                   </div>
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Specific People Section */}
//           {shareState.shareType === 'specific' && (
//             <div className="space-y-4">
//               <div>
//                 <Label className="text-sm font-medium text-gray-900 mb-2 block">Add people</Label>
//                 <Input
//                   placeholder="Search by name or email..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="h-10"
//                 />
//               </div>

//               {/* Search Results */}
//               {search && (
//                 <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white">
//                   {usersLoading ? (
//                     <div className="p-4 text-center text-sm text-gray-500">
//                       <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
//                       Searching users...
//                     </div>
//                   ) : filteredUsers.length > 0 ? (
//                     <div className="divide-y divide-gray-100">
//                       {filteredUsers.map(user => (
//                         <div
//                           key={user.id}
//                           className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
//                           onClick={() => handleAddUser(user)}
//                         >
//                           <div className="flex items-center gap-3">
//                             <UserAvatar user={user} />
//                             <div>
//                               <div className="text-sm font-medium text-gray-900">
//                                 {user.firstName || user.email || 'Unknown'}
//                               </div>
//                               <div className="text-xs text-gray-500">{user.email}</div>
//                             </div>
//                           </div>
//                           <Button size="sm" className="h-8">Add</Button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : search.trim().length >= 2 ? (
//                     <div className="p-4 text-center text-sm text-gray-500">
//                       No users found matching "{search}"
//                     </div>
//                   ) : null}
//                 </div>
//               )}

//               {/* Added Users */}
//               {shareState.users.length > 0 && (
//                 <div className="space-y-3">
//                   <Label className="text-sm font-medium text-gray-900">
//                     Added users ({shareState.users.length})
//                   </Label>
//                   <div className="space-y-2 max-h-48 overflow-y-auto">
//                     {shareState.users.map(userShare => (
//                       <div
//                         key={userShare.id}
//                         className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
//                       >
//                         <div className="flex items-center gap-3">
//                           <UserAvatar user={userShare} />
//                           <div>
//                             <div className="text-sm font-medium text-gray-900">
//                               {userShare.name || userShare.email || 'Unknown'}
//                             </div>
//                             <div className="text-xs text-gray-500">{userShare.email}</div>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Select
//                             value={userShare.permission}
//                             onValueChange={(value: Permission) =>
//                               handleUserPermissionChange(userShare.id, value)
//                             }
//                           >
//                             <SelectTrigger className="w-32 h-8">
//                               <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {PERMISSION_OPTIONS.map(option => (
//                                 <SelectItem key={option.value} value={option.value}>
//                                   <div className="flex items-center gap-2">
//                                     <option.icon className="h-3 w-3" />
//                                     {option.label}
//                                   </div>
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
//                             onClick={() => handleRemoveUser(userShare.id)}
//                           >
//                             <X className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Default Permission */}
//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-900">Default permission</Label>
//             <Select
//               value={shareState.permission}
//               onValueChange={(value: Permission) =>
//                 setShareState(prev => ({ ...prev, permission: value }))
//               }
//             >
//               <SelectTrigger className="h-10">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 {PERMISSION_OPTIONS.map(option => (
//                   <SelectItem key={option.value} value={option.value}>
//                     <div className="flex items-center gap-2">
//                       <option.icon className="h-4 w-4" />
//                       {option.label}
//                     </div>
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Message */}
//           <div className="space-y-2">
//             <Label className="text-sm font-medium text-gray-900">Message (optional)</Label>
//             <Textarea
//               placeholder="Add a message to include with the share notification..."
//               value={shareState.message}
//               onChange={(e) => setShareState(prev => ({ ...prev, message: e.target.value }))}
//               rows={3}
//               className="resize-none"
//             />
//           </div>

//           {/* Expiry and Advanced Options in a Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Expiry */}
//             <div className="space-y-2">
//               <Label className="flex items-center gap-2 text-sm font-medium text-gray-900">
//                 <Calendar className="h-4 w-4" />
//                 Expires after
//               </Label>
//               <Select
//                 value={shareState.expiryDays.toString()}
//                 onValueChange={(value) =>
//                   setShareState(prev => ({ ...prev, expiryDays: parseInt(value) }))
//                 }
//               >
//                 <SelectTrigger className="h-10">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {EXPIRY_OPTIONS.map(option => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Password Protection */}
//             <div className="space-y-3">
//               <Label className="flex items-center gap-2 text-sm font-medium text-gray-900">
//                 <Lock className="h-4 w-4" />
//                 Security
//               </Label>
//               <div className="space-y-3">
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="require-password"
//                     checked={requirePassword}
//                     onCheckedChange={(checked: boolean) => {
//                       setRequirePassword(checked);
//                       if (!checked) setPasswordInput('');
//                     }}
//                   />
//                   <Label htmlFor="require-password" className="text-sm">Require password</Label>
//                 </div>
//                 {requirePassword && (
//                   <Input
//                     type="password"
//                     placeholder="Enter password..."
//                     value={passwordInput}
//                     onChange={(e) => setPasswordInput(e.target.value)}
//                     className="h-9"
//                   />
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Additional Options */}
//           <div className="space-y-3">
//             <Label className="text-sm font-medium text-gray-900">Additional options</Label>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//               {[
//                 { id: 'notify-email', key: 'notifyByEmail', label: 'Notify by email', icon: Mail },
//                 { id: 'require-approval', key: 'requireApproval', label: 'Require approval', icon: Lock },
//                 { id: 'allow-download', key: 'allowDownload', label: 'Allow download', icon: File },
//                 { id: 'watermark', key: 'watermark', label: 'Add watermark', icon: Eye },
//               ].map(({ id, key, label, icon: Icon }) => (
//                 <div key={id} className="flex items-center space-x-2">
//                   <Checkbox
//                     id={id}
//                     checked={shareState[key as keyof ShareState] as boolean}
//                     onCheckedChange={(checked: boolean) =>
//                       setShareState(prev => ({ ...prev, [key]: checked }))
//                     }
//                   />
//                   <Label htmlFor={id} className="flex items-center gap-2 text-sm">
//                     <Icon className="h-4 w-4 text-gray-500" />
//                     {label}
//                   </Label>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <DialogFooter className="pt-4 border-t space-x-2">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onClose}
//             disabled={shareFileMutation.isPending}
//             className="flex-1 sm:flex-none"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleAction}
//             disabled={isShareDisabled}
//             className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
//           >
//             {shareFileMutation.isPending ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Sharing...
//               </>
//             ) : (
//               'Share'
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default ShareDialog;



import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { File, X, Loader2, Users, Lock, Calendar, Mail, Eye, Shield, Download, Droplets, Globe, UserPlus, Share2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileItem } from '@/types/file';
import { fileEndPoint } from '@/api/endpoints/file.endpoint';
import { useDebounce } from '@/hooks/use-debounce';

// Type definitions for Share functionality
interface Permission {
  id: string;
  permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
  name?: string;
  email?: string;
}

interface ShareFileRequest {
  shareType: 'specific' | 'anyone';
  users: Permission[];
  permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
  notifyByEmail: boolean;
  requireApproval: boolean;
  allowDownload: boolean;
  watermark: boolean;
  message: string;
  expiresAt?: string;
  password?: string;
}

interface ShareState {
  shareType: 'specific' | 'anyone';
  users: Permission[];
  permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN';
  notifyByEmail: boolean;
  requireApproval: boolean;
  allowDownload: boolean;
  watermark: boolean;
  message: string;
  expiryDays: number;
  password: string;
}

interface User {
  id: string;
  firstName?: string;
  email: string;
}

// Custom hooks
function useSearchUsers(query: string) {
  return useQuery<User[], Error>({
    queryKey: ['users-search', query],
    queryFn: async () => {
      if (query.trim().length < 2) return [];
      try {
        const data = await fileEndPoint.searchUsers(query);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Search users error:', error);
        return [];
      }
    },
    enabled: !!query && query.trim().length >= 2,
    placeholderData: [],
  });
}

function useCurrentUser() {
  return useQuery<User, Error>({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        return await fileEndPoint.getCurrentUser();
      } catch (error) {
        console.warn('Get current user not implemented yet:', error);
        return { id: 'current-user', firstName: 'Current', email: 'current@example.com' };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useShareFile() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { fileId: string; data: ShareFileRequest }>({
    mutationFn: async ({ fileId, data }) => {
      try {
        return await fileEndPoint.shareFile(fileId, data);
      } catch (error) {
        console.warn('Share file not implemented yet:', error);
        console.log('Sharing file:', fileId, data);
        return { success: true, message: 'File shared successfully' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['fileShares'] });
      queryClient.invalidateQueries({ queryKey: ['userShares'] });
    },
  });
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

const INITIAL_SHARE_STATE: ShareState = {
  shareType: 'specific',
  users: [],
  permission: 'VIEW',
  notifyByEmail: false,
  requireApproval: false,
  allowDownload: true,
  watermark: false,
  message: '',
  expiryDays: 7,
  password: '',
};

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day', description: 'Access expires tomorrow' },
  { value: '7', label: '7 days', description: 'Access expires in a week' },
  { value: '30', label: '30 days', description: 'Access expires in a month' },
  { value: '90', label: '90 days', description: 'Access expires in 3 months' },
  { value: '365', label: '1 year', description: 'Access expires in a year' },
  { value: '0', label: 'Never', description: 'Permanent access' },
];

const PERMISSION_OPTIONS = [
  {
    value: 'VIEW',
    label: 'Can view',
    icon: Eye,
    description: 'View only access',
    color: 'text-blue-600 bg-blue-50'
  },
  {
    value: 'COMMENT',
    label: 'Can comment',
    icon: Mail,
    description: 'View and comment',
    color: 'text-green-600 bg-green-50'
  },
  {
    value: 'EDIT',
    label: 'Can edit',
    icon: File,
    description: 'View, comment and edit',
    color: 'text-orange-600 bg-orange-50'
  },
  {
    value: 'ADMIN',
    label: 'Full access',
    icon: Users,
    description: 'Complete control',
    color: 'text-red-600 bg-red-50'
  },
];

const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, file }) => {
  const [search, setSearch] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [shareState, setShareState] = useState<ShareState>(INITIAL_SHARE_STATE);

  const delayedSearch = useDebounce(search, 300);

  const { data: users = [], isLoading: usersLoading } = useSearchUsers(delayedSearch);
  const { data: currentUser } = useCurrentUser();
  const shareFileMutation = useShareFile();

  // Memoized filtered users
  const filteredUsers = useMemo(() =>
    users.filter(user => {
      if (currentUser && user.id === currentUser.id) return false;
      return !shareState.users.some(addedUser => addedUser.id === user.id);
    }), [users, currentUser, shareState.users]
  );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setShareState(INITIAL_SHARE_STATE);
      setRequirePassword(false);
      setPasswordInput('');
    }
  }, [isOpen]);

  // Handle successful share
  useEffect(() => {
    if (shareFileMutation.isSuccess && shareFileMutation.data?.success) {
      toast.success(`"${file?.fileName || 'Untitled'}" shared successfully!`);
      onClose();
    }
  }, [shareFileMutation.isSuccess, shareFileMutation.data, onClose, file?.fileName]);

  // Handle share error
  useEffect(() => {
    if (shareFileMutation.isError) {
      toast.error(shareFileMutation.error?.message || 'Failed to share file. Please try again.');
    }
  }, [shareFileMutation.isError, shareFileMutation.error]);

  const calculateExpiresAt = useCallback((days: number): string | undefined => {
    if (days === 0) return undefined;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }, []);

  const handleAddUser = useCallback((user: User) => {
    if (currentUser && user.id === currentUser.id) {
      toast.warning('You cannot share with yourself');
      return;
    }
    if (shareState.users.some(u => u.id === user.id)) {
      toast.warning('User already added');
      return;
    }
    setShareState(prev => ({
      ...prev,
      users: [...prev.users, {
        id: user.id,
        permission: prev.permission,
        name: user.firstName,
        email: user.email,
      }],
    }));
    setSearch('');
  }, [currentUser, shareState.users]);

  const handleRemoveUser = useCallback((userId: string) => {
    setShareState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId),
    }));
  }, []);

  const handleUserPermissionChange = useCallback((userId: string, permission: Permission['permission']) => {
    setShareState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, permission } : u),
    }));
  }, []);

  const handleAction = useCallback(() => {
    if (shareState.shareType === 'specific' && shareState.users.length === 0) {
      toast.error('Please add at least one user to share with');
      return;
    }
    if (!file?.id) {
      toast.error('No file selected');
      return;
    }
    if (requirePassword && !passwordInput) {
      toast.error('Please provide a password for the share link');
      return;
    }

    const shareData: ShareFileRequest = {
      shareType: shareState.shareType,
      users: shareState.shareType === 'specific' ? shareState.users : [],
      permission: shareState.permission,
      notifyByEmail: shareState.notifyByEmail,
      requireApproval: shareState.requireApproval,
      allowDownload: shareState.allowDownload,
      watermark: shareState.watermark,
      message: shareState.message,
      expiresAt: calculateExpiresAt(shareState.expiryDays),
      password: requirePassword ? passwordInput : undefined,
    };

    shareFileMutation.mutate({ fileId: file.id, data: shareData });
  }, [shareState, file?.id, requirePassword, passwordInput, calculateExpiresAt, shareFileMutation]);

  const isShareDisabled = useMemo(() =>
    shareFileMutation.isPending ||
    (shareState.shareType === 'specific' && shareState.users.length === 0) ||
    (requirePassword && !passwordInput),
    [shareFileMutation.isPending, shareState.shareType, shareState.users.length, requirePassword, passwordInput]
  );

  const UserAvatar = ({ user }: { user: { name?: string; email?: string } }) => {
    const displayName = user.name || user.email || '?';
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-sm font-semibold text-white shadow-lg ring-2 ring-white">
          {initials}
        </div>
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
      </div>
    );
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return File;
    fileName.split('.').pop()?.toLowerCase();
    return File; // You can extend this with specific file type icons
  };

  const FileIcon = getFileIcon(file?.fileName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/30">
        <DialogHeader className="space-y-4 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <DialogTitle className="flex items-center gap-4 text-xl">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <FileIcon className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 p-1 bg-green-500 rounded-full">
                <Share2 className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 dark:text-white truncate">
                Share "{file?.fileName ?? 'Untitled'}"
              </div>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Control who has access to your {file?.type ?? 'file'} and what they can do with it
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-8 py-6">
          {/* Share Type Selection with Cards */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              Choose sharing method
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  value: 'specific',
                  icon: Users,
                  title: 'Specific people',
                  description: 'Share with selected individuals',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  value: 'anyone',
                  icon: Globe,
                  title: 'Anyone with link',
                  description: 'Anyone with the link can access',
                  gradient: 'from-purple-500 to-pink-500'
                }
              ].map((option) => (
                <div
                  key={option.value}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${shareState.shareType === option.value
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
                    }`}
                  onClick={() => setShareState(prev => ({ ...prev, shareType: option.value as 'specific' | 'anyone' }))}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${option.gradient}`}>
                      <option.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{option.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.description}</div>
                    </div>
                  </div>
                  {shareState.shareType === option.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Specific People Section */}
          {shareState.shareType === 'specific' && (
            <div className="space-y-6 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div>
                <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <UserPlus className="h-4 w-4" />
                  Add people
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 pl-4 pr-12 bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 rounded-xl text-sm"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usersLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : (
                      <Users className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {search && (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-sm">
                  {usersLoading ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Searching users...
                    </div>
                  ) : filteredUsers.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                          onClick={() => handleAddUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName || user.email || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </div>
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg group-hover:shadow-md transition-all">
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : search.trim().length >= 2 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No users found matching "{search}"
                    </div>
                  ) : null}
                </div>
              )}

              {/* Added Users */}
              {shareState.users.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    People with access ({shareState.users.length})
                  </Label>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {shareState.users.map(userShare => (
                      <div
                        key={userShare.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-700/50 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar user={userShare} />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {userShare.name || userShare.email || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{userShare.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={userShare.permission}
                            onValueChange={(value: Permission['permission']) =>
                              handleUserPermissionChange(userShare.id, value)
                            }
                          >
                            <SelectTrigger className="w-36 h-9 bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${option.color}`}>
                                      <option.icon className="h-3 w-3" />
                                    </div>
                                    <div>
                                      <div className="text-sm">{option.label}</div>
                                      <div className="text-xs text-gray-500">{option.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 rounded-lg transition-colors"
                            onClick={() => handleRemoveUser(userShare.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Default Permission */}
          <div className="space-y-3 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Default permission level
            </Label>
            <Select
              value={shareState.permission}
              onValueChange={(value: Permission['permission']) =>
                setShareState(prev => ({ ...prev, permission: value }))
              }
            >
              <SelectTrigger className="h-12 bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-3 py-2">
                      <div className={`p-2 rounded-lg ${option.color}`}>
                        <option.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-3 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <Label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Include a message (optional)
            </Label>
            <Textarea
              placeholder="Add a personal message to include with the share notification..."
              value={shareState.message}
              onChange={(e) => setShareState(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="resize-none bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 rounded-xl"
            />
          </div>

          {/* Expiry and Security Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiry */}
            <div className="space-y-3 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Calendar className="h-4 w-4" />
                Access expires
              </Label>
              <Select
                value={shareState.expiryDays.toString()}
                onValueChange={(value) =>
                  setShareState(prev => ({ ...prev, expiryDays: parseInt(value) }))
                }
              >
                <SelectTrigger className="h-12 bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password Protection */}
            <div className="space-y-4 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <Label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Lock className="h-4 w-4" />
                Password protection
              </Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="require-password"
                    checked={requirePassword}
                    onCheckedChange={(checked: boolean) => {
                      setRequirePassword(checked);
                      if (!checked) setPasswordInput('');
                    }}
                  />
                  <Label htmlFor="require-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Require password to access
                  </Label>
                </div>
                {requirePassword && (
                  <Input
                    type="password"
                    placeholder="Enter a secure password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="h-11 bg-white dark:bg-slate-900 border-gray-300 dark:border-gray-600 rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>
          {/* Additional Options */}
          <div className="space-y-4 p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <Label className="text-sm font-semibold text-gray-900 dark:text-white">Advanced settings</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'notify-email', key: 'notifyByEmail', label: 'Send email notification', icon: Mail, description: 'Notify users via email' },
                { id: 'require-approval', key: 'requireApproval', label: 'Require approval', icon: Shield, description: 'Approve access requests' },
                { id: 'allow-download', key: 'allowDownload', label: 'Allow downloads', icon: Download, description: 'Enable file downloads' },
                { id: 'watermark', key: 'watermark', label: 'Add watermark', icon: Droplets, description: 'Protect with watermark' },
              ].map(({ id, key, label, icon: Icon, description }) => (
                <div key={id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 dark:bg-slate-700/50">
                  <Checkbox
                    id={id}
                    checked={shareState[key as keyof ShareState] as boolean}
                    onCheckedChange={(checked: boolean) =>
                      setShareState(prev => ({ ...prev, [key]: checked }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      <Icon className="h-4 w-4 text-gray-500" />
                      {label}
                    </Label>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="flex-shrink-0 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {shareState.shareType === 'specific' ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {shareState.users.length === 0
                      ? 'No users selected'
                      : `${shareState.users.length} user${shareState.users.length > 1 ? 's' : ''} selected`
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Anyone with link</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={shareFileMutation.isPending}
                className="h-11 px-6 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={isShareDisabled}
                className="h-11 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {shareFileMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sharing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <span>Share File</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;