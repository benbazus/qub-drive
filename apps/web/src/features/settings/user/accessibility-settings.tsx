import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUserSettingsByCategory } from "@/hooks/useUserSettings";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function AccessibilitySettings() {
  const { settings, isLoading, updateSettingsAsync, isUpdating } = useUserSettingsByCategory('accessibility');

  const [formData, setFormData] = useState({
    highContrast: false,
    screenReaderOptimized: false,
    keyboardShortcuts: true,
    reducedMotion: false,
    focusIndicators: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        highContrast: settings.highContrast ?? false,
        screenReaderOptimized: settings.screenReaderOptimized ?? false,
        keyboardShortcuts: settings.keyboardShortcuts ?? true,
        reducedMotion: settings.reducedMotion ?? false,
        focusIndicators: settings.focusIndicators ?? true,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsAsync(formData);
      toast.success('Accessibility settings updated successfully');
    } catch (error) {
      toast.error('Failed to update accessibility settings');
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
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>Customize accessibility features for better usability</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>High Contrast</Label>
              <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
            </div>
            <Switch
              checked={formData.highContrast}
              onCheckedChange={(checked) => setFormData({ ...formData, highContrast: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Screen Reader Optimization</Label>
              <p className="text-sm text-muted-foreground">Optimize interface for screen readers</p>
            </div>
            <Switch
              checked={formData.screenReaderOptimized}
              onCheckedChange={(checked) => setFormData({ ...formData, screenReaderOptimized: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Keyboard Shortcuts</Label>
              <p className="text-sm text-muted-foreground">Enable keyboard navigation shortcuts</p>
            </div>
            <Switch
              checked={formData.keyboardShortcuts}
              onCheckedChange={(checked) => setFormData({ ...formData, keyboardShortcuts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
            </div>
            <Switch
              checked={formData.reducedMotion}
              onCheckedChange={(checked) => setFormData({ ...formData, reducedMotion: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Focus Indicators</Label>
              <p className="text-sm text-muted-foreground">Show clear focus indicators</p>
            </div>
            <Switch
              checked={formData.focusIndicators}
              onCheckedChange={(checked) => setFormData({ ...formData, focusIndicators: checked })}
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
  );
}
