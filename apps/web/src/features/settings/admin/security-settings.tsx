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
  Shield,
  Lock,

  UserCheck,
  Globe,
  Database,
  Eye,
  AlertTriangle,
  Save,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import systemSettingsEndpoint, { SystemSettings } from '@/api/endpoints/system-settings.endpoint';

const securitySchema = z.object({
  enableTwoFactorAuth: z.boolean(),
  passwordMinLength: z.number().min(6).max(128),
  passwordRequireSpecialChars: z.boolean(),
  sessionTimeoutMinutes: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(1).max(50),
  lockoutDurationMinutes: z.number().min(1).max(1440),
  enableIpWhitelist: z.boolean(),
  allowedIpRanges: z.string(),
  enableEncryptionAtRest: z.boolean(),
  encryptionAlgorithm: z.string(),
  enableAuditLogging: z.boolean(),
  enableThreatDetection: z.boolean(),
  enableSecurityScanning: z.boolean(),
  securityScanFrequency: z.string(),
});

type SecurityFormData = z.infer<typeof securitySchema>;

interface SecuritySettingsProps {
  settings?: SystemSettings;
}

export default function SecuritySettings({ settings }: SecuritySettingsProps) {

  const queryClient = useQueryClient();

  const form = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      enableTwoFactorAuth: settings?.enableTwoFactorAuth || false,
      passwordMinLength: settings?.passwordMinLength || 8,
      passwordRequireSpecialChars: settings?.passwordRequireSpecialChars || true,
      sessionTimeoutMinutes: settings?.sessionTimeoutMinutes || 60,
      maxLoginAttempts: settings?.maxLoginAttempts || 5,
      lockoutDurationMinutes: settings?.lockoutDurationMinutes || 15,
      enableIpWhitelist: settings?.enableIpWhitelist || false,
      allowedIpRanges: settings?.allowedIpRanges?.join('\n') || '',
      enableEncryptionAtRest: settings?.enableEncryptionAtRest || false,
      encryptionAlgorithm: settings?.encryptionAlgorithm || 'AES-256',
      enableAuditLogging: settings?.enableAuditLogging || true,
      enableThreatDetection: settings?.enableThreatDetection || false,
      enableSecurityScanning: settings?.enableSecurityScanning || false,
      securityScanFrequency: settings?.securityScanFrequency || 'weekly',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SecurityFormData) => {
      const updateData = {
        ...data,
        allowedIpRanges: data.allowedIpRanges
          .split('\n')
          .map(ip => ip.trim())
          .filter(ip => ip.length > 0),
      };
      return systemSettingsEndpoint.updateSettingsByCategory('security', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast('Security Settings Updated', {
        description: 'Security settings have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast('Update Failed', {
        description: error.message || 'Failed to update security settings.',
      });
    },
  });

  const onSubmit = (data: SecurityFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Security Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">2FA Status</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {form.watch('enableTwoFactorAuth') ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Password Length</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {form.watch('passwordMinLength')} chars
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Max Attempts</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {form.watch('maxLoginAttempts')}
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
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Security Configuration</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Configure authentication, access control, and security monitoring settings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Authentication Settings Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Authentication Settings</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Configure user authentication and password policies</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enableTwoFactorAuth"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                          <FormDescription>
                            Require 2FA for all user accounts
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
                    name="passwordMinLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Password Length</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="6"
                            max="128"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum required length for user passwords
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordRequireSpecialChars"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Require Special Characters</FormLabel>
                          <FormDescription>
                            Passwords must contain special characters
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
                    name="sessionTimeoutMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Timeout (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="5"
                            max="1440"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Automatic logout after inactivity period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Login Protection Section */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-900 dark:text-red-100">Login Protection</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">Configure account lockout and brute force protection</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="maxLoginAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Login Attempts</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="50"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Lock account after failed attempts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lockoutDurationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lockout Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="1440"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long to lock account after max attempts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* IP Access Control Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">IP Access Control</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Restrict access by IP address and geographic location</p>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="enableIpWhitelist"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable IP Whitelist</FormLabel>
                        <FormDescription>
                          Restrict access to allowed IP addresses only
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
                  name="allowedIpRanges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allowed IP Ranges</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} placeholder="192.168.1.0/24&#10;10.0.0.0/8" />
                      </FormControl>
                      <FormDescription>
                        One IP address or CIDR range per line (e.g., 192.168.1.0/24)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data Security Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">Data Security</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">Configure encryption and data protection settings</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enableEncryptionAtRest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Encryption at Rest</FormLabel>
                          <FormDescription>
                            Encrypt stored files and data
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
                    name="encryptionAlgorithm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Encryption Algorithm</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AES-256">AES-256</SelectItem>
                              <SelectItem value="AES-192">AES-192</SelectItem>
                              <SelectItem value="AES-128">AES-128</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Encryption algorithm for data at rest
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Security Monitoring Section */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Security Monitoring</h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">Enable logging, threat detection, and security scanning</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="enableAuditLogging"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Audit Logging</FormLabel>
                          <FormDescription>
                            Log security events and user actions
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
                    name="enableThreatDetection"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Threat Detection</FormLabel>
                          <FormDescription>
                            Monitor for suspicious activities
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
                    name="enableSecurityScanning"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Security Scanning</FormLabel>
                          <FormDescription>
                            Periodic security vulnerability scans
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
                    name="securityScanFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Scan Frequency</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          How often to run security scans
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white px-8 py-2 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}