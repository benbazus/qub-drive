import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Mail,
  Server,
  Key,
  Shield,
  CheckCircle,
  Save,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';

import systemSettingsEndpoint, { SystemSettings } from '@/api/endpoints/system-settings.endpoint';

const emailSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.boolean(),
  SMTP_FROM: z.string().email('Invalid email address').optional().or(z.literal('')),
  SMTP_FROM_NAME: z.string().optional(),
  COMPANY_NAME: z.string().optional(),
  SUPPORT_EMAIL: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailSettingsProps {
  settings?: SystemSettings;
}

export default function EmailSettings({ settings }: EmailSettingsProps) {

  const queryClient = useQueryClient();
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  setIsTestingEmail(false)

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      SMTP_HOST: settings?.SMTP_HOST || '',
      SMTP_PORT: settings?.SMTP_PORT || '587',
      SMTP_USER: settings?.SMTP_USER || '',
      SMTP_PASS: settings?.SMTP_PASS || '',
      SMTP_SECURE: settings?.SMTP_SECURE || false,
      SMTP_FROM: settings?.SMTP_FROM || '',
      SMTP_FROM_NAME: settings?.SMTP_FROM_NAME || '',
      COMPANY_NAME: settings?.COMPANY_NAME || '',
      SUPPORT_EMAIL: settings?.SUPPORT_EMAIL || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmailFormData) => {
      return systemSettingsEndpoint.updateSettingsByCategory('email', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast('Email Settings Updated', {
        description: 'Email settings have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast('Update Failed', {
        description: error.message || 'Failed to update email settings.',
      });
    },
  });



  const testEmailMutation = useMutation({
    mutationFn: (data: EmailFormData) => {
      return systemSettingsEndpoint.testEmailSettings(data);
    },
    onSuccess: (result) => {
      toast(result.success ? 'Email Test Successful' : 'Email Test Failed', {

        description: result.success
          ? 'Email settings are working correctly.'
          : result.error || 'Failed to send test email.',

      });
    },
    onError: (error: any) => {
      toast('Test Failed', {
        description: error.message || 'Failed to test email settings.',

      });
    },
  });

  const onSubmit = (data: EmailFormData) => {
    updateMutation.mutate(data);
  };

  const handleTestEmail = () => {
    const data = form.getValues();
    testEmailMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Email Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Email Status</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {form.watch('SMTP_HOST') ? 'Configured' : 'Not Configured'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Security</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {form.watch('SMTP_SECURE') ? 'Secure (TLS)' : 'Standard'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Email Configuration</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Configure SMTP settings for sending system emails and notifications.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleTestEmail}
              disabled={isTestingEmail}
              variant="outline"
              className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200"
            >
              <TestTube className={`h-4 w-4 mr-2 ${isTestingEmail ? 'animate-pulse' : ''}`} />
              {isTestingEmail ? 'Testing...' : 'Test Email'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* SMTP Server Settings Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Server className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">SMTP Server Settings</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Configure your email server connection</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="SMTP_HOST"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="smtp.gmail.com" />
                        </FormControl>
                        <FormDescription>
                          SMTP server hostname or IP address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="SMTP_PORT"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="587" />
                        </FormControl>
                        <FormDescription>
                          SMTP server port (587 for STARTTLS, 465 for SSL)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="SMTP_USER"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="your-email@example.com" />
                        </FormControl>
                        <FormDescription>
                          Username for SMTP authentication
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="SMTP_PASS"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" />
                        </FormControl>
                        <FormDescription>
                          Password or app-specific password for SMTP authentication
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="SMTP_SECURE"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Secure Connection</FormLabel>
                        <FormDescription>
                          Use SSL/TLS encryption for SMTP connection
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Identity Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Key className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Email Identity</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Configure sender information and company branding</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="SMTP_FROM"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="marvin.ssekebi@gmail.comm" />
                        </FormControl>
                        <FormDescription>
                          Email address used as sender for system emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="SMTP_FROM_NAME"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Loveworld Suite" />
                        </FormControl>
                        <FormDescription>
                          Display name for system emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="COMPANY_NAME"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your Company" />
                        </FormControl>
                        <FormDescription>
                          Company name used in email templates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="SUPPORT_EMAIL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="support@example.com" />
                        </FormControl>
                        <FormDescription>
                          Email address for user support inquiries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={testEmailMutation.isPending}
                  className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200 transition-all duration-200"
                >
                  <TestTube className={`h-4 w-4 mr-2 ${testEmailMutation.isPending ? 'animate-pulse' : ''}`} />
                  {testEmailMutation.isPending ? 'Testing...' : 'Test Email Settings'}
                </Button>

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