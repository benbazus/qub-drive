import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUserSettingsByCategory } from "@/hooks/useUserSettings";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings() {
  const { settings, isLoading, updateSettingsAsync, isUpdating } = useUserSettingsByCategory('notifications');

  const [formData, setFormData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    desktopNotifications: true,
    notifyOnFileShared: true,
    notifyOnFileCommented: true,
    notifyOnFileModified: true,
    notifyOnStorageWarning: true,
    notifyOnSecurityAlerts: true,
    digestFrequency: 'daily',
    emailDigestTime: '09:00',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        emailNotifications: settings.emailNotifications ?? true,
        pushNotifications: settings.pushNotifications ?? true,
        desktopNotifications: settings.desktopNotifications ?? true,
        notifyOnFileShared: settings.notifyOnFileShared ?? true,
        notifyOnFileCommented: settings.notifyOnFileCommented ?? true,
        notifyOnFileModified: settings.notifyOnFileModified ?? true,
        notifyOnStorageWarning: settings.notifyOnStorageWarning ?? true,
        notifyOnSecurityAlerts: settings.notifyOnSecurityAlerts ?? true,
        digestFrequency: settings.digestFrequency || 'daily',
        emailDigestTime: settings.emailDigestTime || '09:00',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsAsync(formData);
      toast.success('Notification settings updated successfully');
    } catch (error) {
      toast.error('Failed to update notification settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Channels</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on mobile devices</p>
              </div>
              <Switch
                checked={formData.pushNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, pushNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">Show browser notifications</p>
              </div>
              <Switch
                checked={formData.desktopNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, desktopNotifications: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>File Shared</Label>
                <p className="text-sm text-muted-foreground">When someone shares a file with you</p>
              </div>
              <Switch
                checked={formData.notifyOnFileShared}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnFileShared: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>File Commented</Label>
                <p className="text-sm text-muted-foreground">When someone comments on your files</p>
              </div>
              <Switch
                checked={formData.notifyOnFileCommented}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnFileCommented: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>File Modified</Label>
                <p className="text-sm text-muted-foreground">When shared files are modified</p>
              </div>
              <Switch
                checked={formData.notifyOnFileModified}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnFileModified: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Storage Warning</Label>
                <p className="text-sm text-muted-foreground">When approaching storage limit</p>
              </div>
              <Switch
                checked={formData.notifyOnStorageWarning}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnStorageWarning: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Alerts</Label>
                <p className="text-sm text-muted-foreground">Important security notifications</p>
              </div>
              <Switch
                checked={formData.notifyOnSecurityAlerts}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnSecurityAlerts: checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="digestFrequency">Email Digest Frequency</Label>
              <Select value={formData.digestFrequency} onValueChange={(value) => setFormData({ ...formData, digestFrequency: value })}>
                <SelectTrigger id="digestFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
