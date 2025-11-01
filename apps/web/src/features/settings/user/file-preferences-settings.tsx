import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useUserSettingsByCategory } from "@/hooks/useUserSettings";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function FilePreferencesSettings() {
  const { settings, isLoading, updateSettingsAsync, isUpdating } = useUserSettingsByCategory('files');

  const [formData, setFormData] = useState({
    defaultFileView: 'grid',
    defaultSortBy: 'modified',
    defaultSortOrder: 'desc',
    autoSaveInterval: 30,
    enableFileVersioning: true,
    confirmBeforeDelete: true,
    showHiddenFiles: false,
    thumbnailQuality: 'medium',
    defaultShareExpiry: 30,
    autoOrganizeFiles: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        defaultFileView: settings.defaultFileView || 'grid',
        defaultSortBy: settings.defaultSortBy || 'modified',
        defaultSortOrder: settings.defaultSortOrder || 'desc',
        autoSaveInterval: settings.autoSaveInterval || 30,
        enableFileVersioning: settings.enableFileVersioning ?? true,
        confirmBeforeDelete: settings.confirmBeforeDelete ?? true,
        showHiddenFiles: settings.showHiddenFiles ?? false,
        thumbnailQuality: settings.thumbnailQuality || 'medium',
        defaultShareExpiry: settings.defaultShareExpiry || 30,
        autoOrganizeFiles: settings.autoOrganizeFiles ?? false,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsAsync(formData);
      toast.success('File preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update file preferences');
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
        <CardTitle>File Preferences</CardTitle>
        <CardDescription>Customize file management and display settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultFileView">Default File View</Label>
              <Select value={formData.defaultFileView} onValueChange={(value) => setFormData({ ...formData, defaultFileView: value })}>
                <SelectTrigger id="defaultFileView">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultSortBy">Default Sort By</Label>
              <Select value={formData.defaultSortBy} onValueChange={(value) => setFormData({ ...formData, defaultSortBy: value })}>
                <SelectTrigger id="defaultSortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="modified">Date Modified</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultSortOrder">Sort Order</Label>
              <Select value={formData.defaultSortOrder} onValueChange={(value) => setFormData({ ...formData, defaultSortOrder: value })}>
                <SelectTrigger id="defaultSortOrder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailQuality">Thumbnail Quality</Label>
              <Select value={formData.thumbnailQuality} onValueChange={(value) => setFormData({ ...formData, thumbnailQuality: value })}>
                <SelectTrigger id="thumbnailQuality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoSaveInterval">Auto-save Interval (seconds)</Label>
              <Input
                id="autoSaveInterval"
                type="number"
                min="10"
                max="300"
                value={formData.autoSaveInterval}
                onChange={(e) => setFormData({ ...formData, autoSaveInterval: parseInt(e.target.value) || 30 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultShareExpiry">Default Share Expiry (days)</Label>
              <Input
                id="defaultShareExpiry"
                type="number"
                min="1"
                max="365"
                value={formData.defaultShareExpiry}
                onChange={(e) => setFormData({ ...formData, defaultShareExpiry: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>File Versioning</Label>
                <p className="text-sm text-muted-foreground">Keep track of file versions</p>
              </div>
              <Switch
                checked={formData.enableFileVersioning}
                onCheckedChange={(checked) => setFormData({ ...formData, enableFileVersioning: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirm Before Delete</Label>
                <p className="text-sm text-muted-foreground">Ask for confirmation before deleting files</p>
              </div>
              <Switch
                checked={formData.confirmBeforeDelete}
                onCheckedChange={(checked) => setFormData({ ...formData, confirmBeforeDelete: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Hidden Files</Label>
                <p className="text-sm text-muted-foreground">Display hidden files and folders</p>
              </div>
              <Switch
                checked={formData.showHiddenFiles}
                onCheckedChange={(checked) => setFormData({ ...formData, showHiddenFiles: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-organize Files</Label>
                <p className="text-sm text-muted-foreground">Automatically organize files by type</p>
              </div>
              <Switch
                checked={formData.autoOrganizeFiles}
                onCheckedChange={(checked) => setFormData({ ...formData, autoOrganizeFiles: checked })}
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
