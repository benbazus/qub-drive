
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HardDrive,
  Archive,
  FileText,
  Settings,
  BarChart3,
  Zap,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

import systemSettingsEndpoint, { SystemSettings } from '@/api/endpoints/system-settings.endpoint';

const storageSchema = z.object({
  defaultMaxStorage: z.string().min(1, 'Default max storage is required'),
  maxFileSize: z.string().min(1, 'Max file size is required'),
  allowedFileTypes: z.string(),
  defaultStoragePath: z.string().min(1, 'Default storage path is required'),
  storageQuotaWarningThreshold: z.number().min(1).max(100),
  enableFileVersioning: z.boolean(),
  maxVersionsPerFile: z.number().min(1),
  autoDeleteOldVersions: z.boolean(),
  fileRetentionDays: z.number().min(1),
  enableFileCompression: z.boolean(),
  compressionLevel: z.number().min(1).max(9),
  enableDuplicateDetection: z.boolean(),
});

type StorageFormData = z.infer<typeof storageSchema>;

interface StorageSettingsProps {
  settings?: SystemSettings;
}

export default function StorageSettings({ settings }: StorageSettingsProps) {

  const queryClient = useQueryClient();

  const form = useForm<StorageFormData>({
    resolver: zodResolver(storageSchema),
    defaultValues: {
      defaultMaxStorage: settings?.defaultMaxStorage?.toString() || '5368709120', // 5GB
      maxFileSize: settings?.maxFileSize?.toString() || '104857600', // 100MB
      allowedFileTypes: settings?.allowedFileTypes?.join(', ') || 'pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,mp3',
      defaultStoragePath: settings?.defaultStoragePath || '/uploads',
      storageQuotaWarningThreshold: settings?.storageQuotaWarningThreshold || 80,
      enableFileVersioning: settings?.enableFileVersioning || false,
      maxVersionsPerFile: settings?.maxVersionsPerFile || 5,
      autoDeleteOldVersions: settings?.autoDeleteOldVersions || false,
      fileRetentionDays: settings?.fileRetentionDays || 365,
      enableFileCompression: settings?.enableFileCompression || false,
      compressionLevel: settings?.compressionLevel || 6,
      enableDuplicateDetection: settings?.enableDuplicateDetection || false,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StorageFormData) => {
      const updateData = {
        ...data,
        allowedFileTypes: data.allowedFileTypes.split(',').map(type => type.trim()),
      };
      return systemSettingsEndpoint.updateSettingsByCategory('storage', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast('Storage Settings Updated', {
        description: 'Storage settings have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast('Update Failed', {
        description: error.message || 'Failed to update storage settings.',
      });
    },
  });

  const onSubmit = (data: StorageFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Storage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <HardDrive className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Storage Limit</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(parseInt(form.watch('defaultMaxStorage') || '0') / (1024 * 1024 * 1024))}GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Max File Size</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {Math.round(parseInt(form.watch('maxFileSize') || '0') / (1024 * 1024))}MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Warning At</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {form.watch('storageQuotaWarningThreshold')}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Storage Configuration</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Configure file storage limits, paths, and file management policies.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultMaxStorage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Max Storage (bytes)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormDescription>
                        Default storage limit per user in bytes (5GB = 5368709120)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxFileSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max File Size (bytes)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormDescription>
                        Maximum file size for uploads in bytes (100MB = 104857600)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultStoragePath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Storage Path</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Base directory path for file storage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageQuotaWarningThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Warning Threshold (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="100"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Send warning when user reaches this percentage of their quota
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowedFileTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed File Types</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of allowed file extensions (e.g., pdf,doc,jpg,png)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Versioning Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Archive className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">File Versioning</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Manage file version history and retention</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enableFileVersioning"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable File Versioning</FormLabel>
                          <FormDescription>
                            Keep track of file versions when files are updated
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxVersionsPerFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Versions Per File</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of versions to keep per file
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoDeleteOldVersions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto Delete Old Versions</FormLabel>
                          <FormDescription>
                            Automatically delete old versions when limit is reached
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fileRetentionDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Retention Days</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Days to retain deleted files before permanent deletion
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* File Optimization Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">File Optimization</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Configure compression and duplicate detection</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enableFileCompression"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable File Compression</FormLabel>
                          <FormDescription>
                            Compress files to save storage space
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compressionLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compression Level</FormLabel>
                        <FormControl>
                          <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                                <SelectItem key={level} value={level.toString()}>
                                  Level {level} {level === 1 ? '(Fastest)' : level === 9 ? '(Best)' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Compression level (1=fastest, 9=best compression)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableDuplicateDetection"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Duplicate Detection</FormLabel>
                          <FormDescription>
                            Detect and prevent duplicate file uploads
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}