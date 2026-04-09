import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Bell, Shield, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export const Settings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage your preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">

        {/* 🔥 CLEAN TABS */}
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Security</TabsTrigger>
        </TabsList>

        {/* ✅ GENERAL */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize your app theme</CardDescription>
            </CardHeader>

            <CardContent className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-zinc-500">
                  Light / Dark mode
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
              >
                Toggle Theme
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Control alerts</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Email Notifications</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-between items-center">
                <Label>Analysis Alerts</Label>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ SECURITY */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>Account protection</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="flex justify-between items-center">
                <Label>Two-Factor Authentication</Label>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <Label>Logout All Devices</Label>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => toast.success("Logged out from all devices")}
                >
                  Logout
                </Button>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
};