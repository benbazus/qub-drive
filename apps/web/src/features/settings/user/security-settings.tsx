import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUserSettingsByCategory } from "@/hooks/useUserSettings";
import { useState, useEffect } from "react";
import { Loader2, Save, Shield } from "lucide-react";
import { toast } from "sonner";

export function SecuritySettings() {
  const { settings, isLoading, updateSettingsAsync, isUpdating } = useUserSettingsByCategory('security');

  const [formData, setFormData] = useState({
    sessionTimeout: 480,
    requirePasswordChange: false,
    enableActivityLog: true,
    enableLoginAlerts: true,
    enableBiometric: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        sessionTimeout: settings.sessionTimeout || 480,
        requirePasswordChange: settings.requirePasswordChange ?? false,
        enableActivityLog: settings.enableActivityLog ?? true,
        enableLoginAlerts: settings.enableLoginAlerts ?? true,
        enableBiometric: settings.enableBiometric ?? false,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsAsync(formData);
      toast.success('Security settings updated successfully');
    } catch (error) {
      toast.error('Failed to update security settings');
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
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>Manage your account security settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min="5"
              max="1440"
              value={formData.sessionTimeout}
              onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) || 480 })}
            />
            <p className="text-sm text-muted-foreground">How long before you're automatically logged out due to inactivity</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Password Change</Label>
                <p className="text-sm text-muted-foreground">Require periodic password changes</p>
              </div>
              <Switch
                checked={formData.requirePasswordChange}
                onCheckedChange={(checked) => setFormData({ ...formData, requirePasswordChange: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Activity Log</Label>
                <p className="text-sm text-muted-foreground">Track your account activity</p>
              </div>
              <Switch
                checked={formData.enableActivityLog}
                onCheckedChange={(checked) => setFormData({ ...formData, enableActivityLog: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Login Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
              </div>
              <Switch
                checked={formData.enableLoginAlerts}
                onCheckedChange={(checked) => setFormData({ ...formData, enableLoginAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Biometric Authentication</Label>
                <p className="text-sm text-muted-foreground">Enable fingerprint or face recognition</p>
              </div>
              <Switch
                checked={formData.enableBiometric}
                onCheckedChange={(checked) => setFormData({ ...formData, enableBiometric: checked })}
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
