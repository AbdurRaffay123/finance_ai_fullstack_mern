  import React, { useState, useEffect } from 'react';
  import Layout from '../components/Layout';
  import { User, Shield, Globe, Save, Check, XCircle } from 'lucide-react';
  import {
    fetchUserSettings,
    updateUserSettings,
    updateUserSecurity,
    uploadProfilePhoto,
  } from '../api';

  const ProfileSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
    const [securityError, setSecurityError] = useState<string | null>(null);
    const [securitySuccess, setSecuritySuccess] = useState(false);

    const [settings, setSettings] = useState({
      profile: {
        fullName: '',
        email: '',
        phone: '',
        profilePhoto: '', // URL to profile photo
      },
      preferences: {
        currency: 'USD',
        language: 'English',
        theme: 'light',
      },
    });

    const [security, setSecurity] = useState({
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    const currencies = [
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
      { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
      { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
      { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
      { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    ];

    useEffect(() => {
      const loadSettings = async () => {
        try {
          const data = await fetchUserSettings();
          setSettings({
            profile: {
              fullName: data.profile.fullName || '',
              email: data.profile.email || '',
              phone: data.profile.phone || '',
              profilePhoto: data.profile.profilePhoto
                ? `http://localhost:5000${data.profile.profilePhoto}`
                : '',
            },
            preferences: {
              currency: data.preferences.currency || 'USD',
              language: data.preferences.language || 'English',
              theme: data.preferences.theme || 'light',
            },
          });
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

    const handlePreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setSettings((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [name]: value,
        },
      }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value,
        },
      }));
    };

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSecurity((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setIsSaving(true);
      setPhotoUploadError(null);
      try {
        const data = await uploadProfilePhoto(file);
        if (data.profilePhoto) {
          setSettings((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              profilePhoto: `http://localhost:5000${data.profilePhoto}`,
            },
          }));
        }
      } catch {
        setPhotoUploadError('Failed to upload photo');
      } finally {
        setIsSaving(false);
      }
    };

    const handleSaveChanges = async () => {
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError(null);
      try {
        await updateUserSettings({
          profile: {
            fullName: settings.profile.fullName,
            email: settings.profile.email,
            phone: settings.profile.phone,
          },
          preferences: settings.preferences,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch {
        setSaveError('Failed to save settings');
      } finally {
        setIsSaving(false);
      }
    };

    const handleSaveSecurity = async () => {
      setSecurityError(null);
      setSecuritySuccess(false);

      if (security.newPassword !== security.confirmPassword) {
        setSecurityError("New password and confirm password don't match");
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
        setSecurityError('Wrong Password');
      } finally {
        setIsSaving(false);
      }
    };

    const tabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'preferences', label: 'Preferences', icon: Globe },
      { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                      {settings.profile.profilePhoto ? (
                        <img
                          src={settings.profile.profilePhoto}
                          alt="Profile"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-12 h-12 text-emerald-600" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block text-sm text-gray-500"
                      disabled={isSaving}
                    />
                  </div>

                  {photoUploadError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {photoUploadError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="John Doe"
                        value={settings.profile.fullName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="john@example.com"
                        value={settings.profile.email}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="+1 (555) 000-0000"
                        value={settings.profile.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        name="currency"
                        value={settings.preferences.currency}
                        onChange={handlePreferenceChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} - {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Theme</label>
                      <select
                        name="theme"
                        value={settings.preferences.theme}
                        onChange={handlePreferenceChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6 max-w-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

                  {securityError && (
                    <p className="mb-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> {securityError}
                    </p>
                  )}

                  {securitySuccess && (
                    <p className="mb-2 text-sm text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Password info updated successfully!
                    </p>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="your-email@example.com"
                      value={security.email}
                      onChange={handleSecurityChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Current password"
                      value={security.currentPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="New password"
                      value={security.newPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Confirm new password"
                      value={security.confirmPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>

                  <button
                    onClick={handleSaveSecurity}
                    disabled={isSaving}
                    className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Update Security Settings'}
                  </button>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex justify-between items-center">
                {saveSuccess && (
                  <div className="flex items-center text-emerald-600">
                    <Check className="w-5 h-5 mr-2" />
                    <span>Settings saved successfully!</span>
                  </div>
                )}

                {saveError && (
                  <div className="flex items-center text-red-600">
                    <XCircle className="w-5 h-5 mr-2" />
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 ml-auto">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      // Reset form or reload user settings if needed
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <Save className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  };

  export default ProfileSettings;
