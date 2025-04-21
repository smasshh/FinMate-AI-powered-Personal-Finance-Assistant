
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      
      setSettings(data);
      setEmailNotifications(data.email_notifications ?? true);
      setDarkMode(data.theme === 'dark');
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          email_notifications: emailNotifications,
          theme: darkMode ? 'dark' : 'light',
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been successfully updated.',
      });
      
      fetchUserSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive',
      });
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Switch 
              id="emailNotifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
            <Label htmlFor="emailNotifications">
              Enable Email Notifications
            </Label>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Switch 
              id="darkMode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
            />
            <Label htmlFor="darkMode">
              Enable Dark Mode
            </Label>
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={handleUpdateSettings}>
        Save Settings
      </Button>
    </div>
  );
};

export default Settings;
