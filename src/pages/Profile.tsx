import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { User, Save, Check, XCircle } from 'lucide-react';
import {
  fetchUserSettings,
  updateUserSettings,
  uploadProfilePhoto,
} from '../api';

const Profile = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    profile: {
      fullName: '',
      email: '',
      phone: '',
      profilePhoto: '',
    },
  });

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
        });
      } catch (error) {
        console.error('Failed to load user settings', error);
      }
    };
    loadSettings();
  }, []);

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
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-900 mb-6 animate-fadeIn">Profile Settings</h1>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {settings.profile.profilePhoto ? (
                    <img
                      src={settings.profile.profilePhoto}
                      alt="Profile"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block text-sm text-gray-500"
                    disabled={isSaving}
                  />
                  <p className="mt-1 text-xs text-gray-500">Upload a profile photo</p>
                </div>
              </div>

              {photoUploadError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {photoUploadError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
                    placeholder="John Doe"
                    value={settings.profile.fullName}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
                    placeholder="john@example.com"
                    value={settings.profile.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
                    placeholder="+1 (555) 000-0000"
                    value={settings.profile.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="flex justify-between items-center">
              {saveSuccess && (
                <div className="flex items-center text-primary-600">
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
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

export default Profile;

