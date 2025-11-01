import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUserSettingsByCategory, useUserSettings } from "@/hooks/useUserSettings";
import { useState, useEffect } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdvancedSettings() {
  const { settings, isLoading, updateSettingsAsync, isUpdating } = useUserSettingsByCategory('advanced');
  const { resetToDefaults, isResetting } = useUserSettings();

  const [formData, setFormData] = useState({
    enableBetaFeatures: false,
    enableAnalytics: true,
    enableCrashReports: true,
    developerMode: false,
    apiAccessEnabled: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        enableBetaFeatures: settings.enableBetaFeatures ?? false,
        enableAnalytics: settings.enableAnalytics ?? true,
        enableCrashReports: settings.enableCrashReports ?? true,
        developerMode: settings.developerMode ?? false,
        apiAccessEnabled: settings.apiAccessEnabled ?? false,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsAsync(formData);
      toast.success('Advanced settings updated successfully');
    } catch (error) {
      toast.error('Failed to update advanced settings');
    }
  };

  const handleResetSettings = () => {
    resetToDefaults();
    toast.success('All settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
          <CardDescription>Advanced settings for power users</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Beta Features</Label>
                <p className="text-sm text-muted-foreground">Enable experimental features</p>
              </div>
              <Switch
                checked={formData.enableBetaFeatures}
                onCheckedChange={(checked) => setFormData({ ...formData, enableBetaFeatures: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">Help improve the app by sending usage data</p>
              </div>
              <Switch
                checked={formData.enableAnalytics}
                onCheckedChange={(checked) => setFormData({ ...formData, enableAnalytics: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Crash Reports</Label>
                <p className="text-sm text-muted-foreground">Automatically send crash reports</p>
              </div>
              <Switch
                checked={formData.enableCrashReports}
                onCheckedChange={(checked) => setFormData({ ...formData, enableCrashReports: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Developer Mode</Label>
                <p className="text-sm text-muted-foreground">Enable developer tools and debugging</p>
              </div>
              <Switch
                checked={formData.developerMode}
                onCheckedChange={(checked) => setFormData({ ...formData, developerMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>API Access</Label>
                <p className="text-sm text-muted-foreground">Enable programmatic API access</p>
              </div>
              <Switch
                checked={formData.apiAccessEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, apiAccessEnabled: checked })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect all your settings</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isResetting}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will reset all your settings to their default values. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSettings} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Reset All Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
