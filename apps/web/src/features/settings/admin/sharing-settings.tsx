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
import {
  Share2,
  Link,
  Users,
  Eye,
  Save,
  Globe,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

import systemSettingsEndpoint, { SystemSettings } from '@/api/endpoints/system-settings.endpoint';

const sharingSchema = z.object({
  enablePublicSharing: z.boolean(),
  enablePasswordProtectedSharing: z.boolean(),
  defaultShareExpiration: z.number().min(1),
  maxShareExpiration: z.number().min(1),
  enableDownloadTracking: z.boolean(),
  enableCollaborativeEditing: z.boolean(),
  maxCollaboratorsPerFile: z.number().min(1),
  enableComments: z.boolean(),
  enableFilePreview: z.boolean(),
  previewableFileTypes: z.string(),
});

type SharingFormData = z.infer<typeof sharingSchema>;

interface SharingSettingsProps {
  settings?: SystemSettings;
}

export default function SharingSettings({ settings }: SharingSettingsProps) {

  const queryClient = useQueryClient();

  const form = useForm<SharingFormData>({
    resolver: zodResolver(sharingSchema),
    defaultValues: {
      enablePublicSharing: settings?.enablePublicSharing || false,
      enablePasswordProtectedSharing: settings?.enablePasswordProtectedSharing || true,
      defaultShareExpiration: settings?.defaultShareExpiration || 7,
      maxShareExpiration: settings?.maxShareExpiration || 30,
      enableDownloadTracking: settings?.enableDownloadTracking || false,
      enableCollaborativeEditing: settings?.enableCollaborativeEditing || false,
      maxCollaboratorsPerFile: settings?.maxCollaboratorsPerFile || 10,
      enableComments: settings?.enableComments || false,
      enableFilePreview: settings?.enableFilePreview || true,
      previewableFileTypes: settings?.previewableFileTypes?.join(', ') || 'pdf,doc,docx,txt,jpg,jpeg,png,gif',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SharingFormData) => {
      const updateData = {
        ...data,
        previewableFileTypes: data.previewableFileTypes
          .split(',')
          .map(type => type.trim())
          .filter(type => type.length > 0),
      };
      return systemSettingsEndpoint.updateSettingsByCategory('sharing', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast('Sharing Settings Updated', {
        description: 'Sharing and collaboration settings have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast('Update Failed', {
        description: error.message || 'Failed to update sharing settings.',
      });
    },
  });

  const onSubmit = (data: SharingFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Sharing Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Public Sharing</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {form.watch('enablePublicSharing') ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Default Expiry</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {form.watch('defaultShareExpiration')} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Max Collaborators</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {form.watch('maxCollaboratorsPerFile')}
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
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Sharing & Collaboration</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Configure file sharing, collaboration features, and access controls.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Sharing Options Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Link className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Sharing Options</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Configure public sharing and link protection settings</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enablePublicSharing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public Sharing</FormLabel>
                          <FormDescription>
                            Allow users to share files publicly via links
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
                    name="enablePasswordProtectedSharing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Password Protection</FormLabel>
                          <FormDescription>
                            Allow password-protected share links
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
                    name="defaultShareExpiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Share Expiration (days)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Default expiration time for share links
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxShareExpiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Share Expiration (days)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum allowed expiration time for share links
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableDownloadTracking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Download Tracking</FormLabel>
                          <FormDescription>
                            Track downloads of shared files
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

              {/* Collaboration Features Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">Collaboration Features</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Enable real-time collaboration and commenting features</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enableCollaborativeEditing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Collaborative Editing</FormLabel>
                          <FormDescription>
                            Allow multiple users to edit files simultaneously
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
                    name="maxCollaboratorsPerFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Collaborators Per File</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of users who can collaborate on a single file
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableComments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Comments</FormLabel>
                          <FormDescription>
                            Allow users to add comments to files
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
                    name="enableFilePreview"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">File Preview</FormLabel>
                          <FormDescription>
                            Enable inline preview of supported file types
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

              {/* File Preview Configuration */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">File Preview Configuration</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Configure which file types can be previewed inline</p>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="previewableFileTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previewable File Types</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of file extensions that can be previewed (e.g., pdf,doc,jpg,png)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Sharing Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}