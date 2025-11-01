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
  Shield,
  Calendar,
  FileText,
  AlertTriangle,
  Save,
  Clock,
  Scale,

} from 'lucide-react';
import { toast } from 'sonner';

import systemSettingsEndpoint, { SystemSettings } from '@/api/endpoints/system-settings.endpoint';

const complianceSchema = z.object({
  enableGdprCompliance: z.boolean(),
  dataRetentionPolicyDays: z.number().min(1),
  enableRightToBeForgotten: z.boolean(),
  enableDataPortability: z.boolean(),
  complianceReportingEnabled: z.boolean(),
  enableDataClassification: z.boolean(),
  dataClassificationLevels: z.string(),
});

type ComplianceFormData = z.infer<typeof complianceSchema>;

interface ComplianceSettingsProps {
  settings?: SystemSettings;
}

export default function ComplianceSettings({ settings }: ComplianceSettingsProps) {

  const queryClient = useQueryClient();

  const form = useForm<ComplianceFormData>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      enableGdprCompliance: settings?.enableGdprCompliance || false,
      dataRetentionPolicyDays: settings?.dataRetentionPolicyDays || 2557, // 7 years
      enableRightToBeForgotten: settings?.enableRightToBeForgotten || false,
      enableDataPortability: settings?.enableDataPortability || false,
      complianceReportingEnabled: settings?.complianceReportingEnabled || false,
      enableDataClassification: settings?.enableDataClassification || false,
      dataClassificationLevels: settings?.dataClassificationLevels?.join('\n') || 'Public\nInternal\nConfidential\nRestricted',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ComplianceFormData) => {
      const updateData = {
        ...data,
        dataClassificationLevels: data.dataClassificationLevels
          .split('\n')
          .map(level => level.trim())
          .filter(level => level.length > 0),
      };
      return systemSettingsEndpoint.updateSettingsByCategory('compliance', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast('Compliance Settings Updated', {
        description: 'Compliance and legal settings have been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast('Update Failed', {
        description: error.message || 'Failed to update compliance settings.',
      });
    },
  });

  const onSubmit = (data: ComplianceFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Compliance Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">GDPR Status</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {form.watch('enableGdprCompliance') ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Retention Period</p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(form.watch('dataRetentionPolicyDays') / 365)} years
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Data Classification</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {form.watch('enableDataClassification') ? 'Active' : 'Inactive'}
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
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Compliance & Legal</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Configure data protection, retention policies, and regulatory compliance settings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* GDPR Compliance Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">GDPR Compliance</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">General Data Protection Regulation compliance features</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="enableGdprCompliance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable GDPR Compliance</FormLabel>
                          <FormDescription>
                            Activate GDPR compliance features and data protection measures
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
                    name="enableRightToBeForgotten"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Right to Be Forgotten</FormLabel>
                          <FormDescription>
                            Allow users to request complete data deletion
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
                    name="enableDataPortability"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Data Portability</FormLabel>
                          <FormDescription>
                            Allow users to export their data in a structured format
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

              {/* Data Retention Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Data Retention</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Configure automatic data retention and deletion policies</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dataRetentionPolicyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Retention Period (days)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long to retain user data before automatic deletion (default: 2557 days / 7 years)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complianceReportingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Compliance Reporting</FormLabel>
                          <FormDescription>
                            Generate periodic compliance reports
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

              {/* Data Classification Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Data Classification</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Classify data by sensitivity levels for enhanced security</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="enableDataClassification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Data Classification</FormLabel>
                          <FormDescription>
                            Classify data based on sensitivity levels for better security controls
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
                    name="dataClassificationLevels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Classification Levels</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={6} />
                        </FormControl>
                        <FormDescription>
                          One classification level per line (e.g., Public, Internal, Confidential, Restricted)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Compliance Notice */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-yellow-500 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Compliance Notice
                    </h3>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
                      <p>
                        Compliance settings may have legal implications for your organization.
                        Please consult with your legal team before enabling GDPR or other regulatory features.
                      </p>
                      <p>
                        Changes to data retention policies may affect existing data and require careful implementation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-2 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Compliance Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}