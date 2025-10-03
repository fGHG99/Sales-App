import React, { useState } from 'react';
import { Mail, MessageSquare, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { mockSystemConfig } from '../mock/MockData';
import ConfirmationModal from '../modal/WarningConfirmation';

const SystemConfiguration = () => {
  const [config, setConfig] = useState(mockSystemConfig);
  const [formData, setFormData] = useState({
    emailAgent: config.emailAgent,
    emailPassword: '',
    smsNumber: config.smsNumber
  });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: null, data: null });

  const handleSave = () => {
    setConfirmationModal({
      isOpen: true,
      action: 'update_system',
      data: formData,
      title: 'Confirm System Configuration Update',
      message: 'Are you sure you want to update system configuration? This may affect email notifications and SMS verifications. Incorrect settings may disrupt user communications.'
    });
  };

  const executeConfirmedAction = () => {
    const { action, data } = confirmationModal;
    
    if (action === 'update_system') {
      setConfig({
        ...config,
        emailAgent: data.emailAgent,
        emailPassword: data.emailPassword || config.emailPassword,
        smsNumber: data.smsNumber
      });
    }
    
    setConfirmationModal({ isOpen: false, action: null, data: null });
  };

  const hasChanges = () => {
    return formData.emailAgent !== config.emailAgent ||
           formData.emailPassword !== '' ||
           formData.smsNumber !== config.smsNumber;
  };

  const handleReset = () => {
    setFormData({
      emailAgent: config.emailAgent,
      emailPassword: '',
      smsNumber: config.smsNumber
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold">System Configuration</h3>
        <p className="text-gray-600">Configure email and SMS settings for user verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Current Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Agent Email</h4>
                  <p className="text-sm text-gray-600">Email address for system notifications</p>
                </div>
                <p className="font-mono text-sm mt-2">{config.emailAgent}</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Password</h4>
                  <p className="text-sm text-gray-600">App password for email authentication</p>
                </div>
                <p className="font-mono text-sm mt-2">{config.emailPassword}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Current SMS Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">SMS Number</h4>
                <p className="text-sm text-gray-600">Phone number for SMS verification</p>
              </div>
              <p className="font-mono text-sm mt-2">{config.smsNumber}</p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800">SMS Service Status</h4>
              <p className="text-sm text-blue-600 mt-1">Active - Ready to send verification codes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Configuration Section */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailAgent">Agent Email</Label>
                <Input
                  id="emailAgent"
                  type="email"
                  value={formData.emailAgent}
                  onChange={(e) => setFormData({
                    ...formData, 
                    emailAgent: e.target.value
                  })}
                  placeholder="Enter system email address"
                />
                <p className="text-sm text-gray-600 mt-1">
                  This email will be used for sending notifications
                </p>
              </div>

              <div>
                <Label htmlFor="emailPassword">App Password</Label>
                <div className="relative">
                  <Input
                    id="emailPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.emailPassword}
                    onChange={(e) => setFormData({
                      ...formData, 
                      emailPassword: e.target.value
                    })}
                    placeholder="Enter new app password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Leave empty to keep current password
                </p>
              </div>
            </div>
          </div>

          {/* SMS Configuration Section */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smsNumber">SMS Number</Label>
                <Input
                  id="smsNumber"
                  type="tel"
                  value={formData.smsNumber}
                  onChange={(e) => setFormData({
                    ...formData, 
                    smsNumber: e.target.value
                  })}
                  placeholder="Enter SMS service number"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Format: +62XXXXXXXXXX
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges()}
              className="flex-1 sm:flex-none"
            >
              Reset Changes
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges()}
              className="flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Test */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Test Email</h4>
              <p className="text-sm text-gray-600 mb-3">
                Send a test email to verify configuration
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Send Test Email
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Test SMS</h4>
              <p className="text-sm text-gray-600 mb-3">
                Send a test SMS to verify configuration
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Send Test SMS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h5 className="font-medium text-amber-800">Email Configuration</h5>
              <ul className="list-disc list-inside text-amber-700 mt-1">
                <li>Use app passwords, not regular email passwords</li>
                <li>Ensure 2-factor authentication is enabled for the email account</li>
                <li>Gmail users need to generate app-specific passwords</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-800">SMS Configuration</h5>
              <ul className="list-disc list-inside text-blue-700 mt-1">
                <li>Ensure the SMS service provider is properly configured</li>
                <li>Test SMS functionality after making changes</li>
                <li>Monitor SMS credits and renewal dates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, action: null, data: null })}
        onConfirm={executeConfirmedAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
    </div>
  );
};

export default SystemConfiguration;