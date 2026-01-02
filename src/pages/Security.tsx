import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Shield, Check, XCircle, Mail, Lock } from 'lucide-react';
import {
  fetchUserSettings,
  updateUserSecurity,
} from '../api';
import Input from '../components/Input';

const Security = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState(false);

  const [security, setSecurity] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchUserSettings();
        setSecurity((prev) => ({
          ...prev,
          email: data.profile.email || '',
        }));
      } catch (error) {
        console.error('Failed to load user settings', error);
      }
    };
    loadSettings();
  }, []);

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurity((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSecurity = async () => {
    setSecurityError(null);
    setSecuritySuccess(false);

    if (security.newPassword !== security.confirmPassword) {
      setSecurityError("New password and confirm password don't match");
      return;
    }

    if (security.newPassword && security.newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters long');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserSecurity({
        email: security.email,
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      });
      setSecuritySuccess(true);
      setSecurity((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setSecuritySuccess(false), 3000);
    } catch (err: any) {
      setSecurityError(err.response?.data?.message || 'Wrong Password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-900 mb-6 animate-fadeIn">Security Settings</h1>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="space-y-6 max-w-md">
              {securityError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {securityError}
                  </p>
                </div>
              )}

              {securitySuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-primary-600 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Password updated successfully!
                  </p>
                </div>
              )}

              <Input
                type="email"
                name="email"
                label="Email"
                leftIcon={Mail}
                placeholder="your-email@example.com"
                value={security.email}
                onChange={handleSecurityChange}
              />

              <Input
                type="password"
                name="currentPassword"
                label="Current Password"
                leftIcon={Lock}
                placeholder="Current password"
                value={security.currentPassword}
                onChange={handleSecurityChange}
              />

              <Input
                type="password"
                name="newPassword"
                label="New Password"
                leftIcon={Lock}
                placeholder="New password (min 6 characters)"
                value={security.newPassword}
                onChange={handleSecurityChange}
              />

              <Input
                type="password"
                name="confirmPassword"
                label="Confirm New Password"
                leftIcon={Lock}
                placeholder="Confirm new password"
                value={security.confirmPassword}
                onChange={handleSecurityChange}
              />

              <button
                onClick={handleSaveSecurity}
                disabled={isSaving}
                className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Update Security Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Security;

