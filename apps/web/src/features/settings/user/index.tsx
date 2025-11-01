import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, Bell, Shield, Lock, FileText, Accessibility, Settings2 } from "lucide-react";
import { ProfileSettings } from "./profile-settings";
import { AppearanceSettings } from "./appearance-settings";
import { NotificationSettings } from "./notification-settings";
import { PrivacySettings } from "./privacy-settings";
import { SecuritySettings } from "./security-settings";
import { FilePreferencesSettings } from "./file-preferences-settings";
import { AccessibilitySettings } from "./accessibility-settings";
import { AdvancedSettings } from "./advanced-settings";

export function UserSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Settings</h2>
        <p className="text-muted-foreground">
          Manage your personal preferences and account settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Accessibility className="h-4 w-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="files">
          <FilePreferencesSettings />
        </TabsContent>

        <TabsContent value="accessibility">
          <AccessibilitySettings />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserSettings;
