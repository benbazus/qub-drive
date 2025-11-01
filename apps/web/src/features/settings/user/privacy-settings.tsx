import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUserSettingsByCategory } from "@/hooks/useUserSettings";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function PrivacySettings() {
  const { settings, isLoading, updateSettingsAsync, isUpdating } = useUserSettingsByCategory('privacy');

  const [formData, setFormData] = useState({
    profileVisibility: 'private',
    showEmail: false,
    showPhoneNumber: false,
    showLastLogin: false,
    allowMessages: true,
    allowSearchIndexing: true,
    shareActivityStatus: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        profileVisibility: settings.profileVisibility || 'private',
        showEmail: settings.showEmail ?? false,
        showPhoneNumber: settings.showPhoneNumber ?? false,
        showLastLogin: settings.showLastLogin ?? false,
        allowMessages: settings.allowMessages ?? true,
        allowSearchIndexing: settings.allowSearchIndexing ?? true,
        shareActivityStatus: settings.shareActivityStatus ?? true,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsAsync(formData);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      toast.error('Failed to update privacy settings');
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
        <CardTitle>Privacy</CardTitle>
        <CardDescription>Control your privacy and data sharing preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select value={formData.profileVisibility} onValueChange={(value) => setFormData({ ...formData, profileVisibility: value })}>
              <SelectTrigger id="profileVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="team">Team Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Profile Information</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Email</Label>
                <p className="text-sm text-muted-foreground">Display your email on your profile</p>
              </div>
              <Switch
                checked={formData.showEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, showEmail: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Phone Number</Label>
                <p className="text-sm text-muted-foreground">Display your phone number</p>
              </div>
              <Switch
                checked={formData.showPhoneNumber}
                onCheckedChange={(checked) => setFormData({ ...formData, showPhoneNumber: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Last Login</Label>
                <p className="text-sm text-muted-foreground">Show when you were last active</p>
              </div>
              <Switch
                checked={formData.showLastLogin}
                onCheckedChange={(checked) => setFormData({ ...formData, showLastLogin: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Communication</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Messages</Label>
                <p className="text-sm text-muted-foreground">Allow other users to send you messages</p>
              </div>
              <Switch
                checked={formData.allowMessages}
                onCheckedChange={(checked) => setFormData({ ...formData, allowMessages: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Search Indexing</Label>
                <p className="text-sm text-muted-foreground">Allow your profile to be found in search</p>
              </div>
              <Switch
                checked={formData.allowSearchIndexing}
                onCheckedChange={(checked) => setFormData({ ...formData, allowSearchIndexing: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Share Activity Status</Label>
                <p className="text-sm text-muted-foreground">Share your online/offline status</p>
              </div>
              <Switch
                checked={formData.shareActivityStatus}
                onCheckedChange={(checked) => setFormData({ ...formData, shareActivityStatus: checked })}
              />
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
