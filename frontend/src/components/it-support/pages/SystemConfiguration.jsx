import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Phone, Server } from 'lucide-react';
import { useToast } from '@/components/hook/useToast';
import { mockData } from '../data/mockData';
import WarningModal from '../modal/WarningModal';

export default function SystemConfiguration() {
  const { toast } = useToast();
  const [config, setConfig] = useState(mockData.systemConfig);
  const [showPassword, setShowPassword] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningAction, setWarningAction] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(null);

  const handleConfigChange = (section, field, value) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    };
    
    setPendingChanges(newConfig);
    setWarningAction(() => () => {
      setConfig(newConfig);
      toast({ 
        title: 'Configuration updated', 
        description: `${section} settings have been modified.` 
      });
    });
    setIsWarningModalOpen(true);
  };

  const getMaskedPassword = () => {
    return '********';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System Configuration</h2>
        <p className="text-slate-600">Manage email and communication settings</p>
      </div>

      <div className="grid gap-6">
        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure SMTP settings for system email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userAgent">User Agent Email</Label>
                <Input
                  id="userAgent"
                  type="email"
                  value={config.email.userAgent}
                  onChange={(e) => handleConfigChange('email', 'userAgent', e.target.value)}
                  placeholder="support@company.com"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This email will be used as the sender for system notifications
                </p>
              </div>
              
              <div>
                <Label htmlFor="appPassword">App Password</Label>
                <div className="relative">
                  <Input
                    id="appPassword"
                    type={showPassword ? "text" : "password"}
                    value={showPassword ? config.email.appPassword : getMaskedPassword()}
                    onChange={(e) => handleConfigChange('email', 'appPassword', e.target.value)}
                    placeholder="Enter app-specific password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  App-specific password for secure email authentication
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Email Configuration Notes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use app-specific passwords for Gmail and similar providers</li>
                <li>• Ensure the sender email is verified with your provider</li>
                <li>• Test email configuration after making changes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Twilio Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Twilio SMS Configuration
            </CardTitle>
            <CardDescription>
              Configure Twilio settings for SMS notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountSid">Account SID</Label>
                <Input
                  id="accountSid"
                  value={config.twilio.accountSid}
                  onChange={(e) => handleConfigChange('twilio', 'accountSid', e.target.value)}
                  placeholder="AC1234567890abcdef..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your Twilio Account SID from the console
                </p>
              </div>
              
              <div>
                <Label htmlFor="authToken">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="authToken"
                    type="password"
                    value="********"
                    onChange={(e) => handleConfigChange('twilio', 'authToken', e.target.value)}
                    placeholder="Enter auth token"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Your Twilio Auth Token (kept secure)
                </p>
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={config.twilio.phoneNumber}
                  onChange={(e) => handleConfigChange('twilio', 'phoneNumber', e.target.value)}
                  placeholder="+1234567890"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your Twilio phone number in E.164 format
                </p>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">SMS Configuration Notes:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Phone number must be in E.164 format (e.g., +1234567890)</li>
                <li>• Verify your phone number in the Twilio console</li>
                <li>• Auth tokens are sensitive and should be kept secure</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Test your email and SMS configuration settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">
                Test Email Configuration
              </Button>
              <Button variant="outline">
                Test SMS Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Modal */}
      <WarningModal
        isOpen={isWarningModalOpen}
        onClose={() => {
          setIsWarningModalOpen(false);
          setPendingChanges(null);
        }}
        onConfirm={warningAction}
        title="Confirm Configuration Change"
        description="This action will modify system configuration settings. Please ensure the new settings are correct before proceeding."
      />
    </div>
  );
};

