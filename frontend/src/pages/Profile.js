import React, { useEffect, useState } from 'react';
import truckingService from '../services/truckingService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Profile() {
  const { updateProfile: updateProfileInAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', address: '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const load = async () => {
    try {
      setLoading(true);
      const data = await truckingService.getProfile();
      setProfile(data);
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
      });
      setError(null);
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Use auth context so localStorage and context user update, triggering header refresh
      await updateProfileInAuth(form);
      setSuccess('Profile updated successfully');
      setError(null);
    } catch (e) {
      setSuccess(null);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await truckingService.changePassword(passwords);
      setSuccess('Password changed successfully');
      setError(null);
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e) {
      const msg = e.response?.data?.current_password || e.response?.data?.detail || 'Failed to change password';
      setSuccess(null);
      setError(typeof msg === 'string' ? msg : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">Update your account information.</p>
      </div>

      {error && (<div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">{error}</div>)}
      {success && (<div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800">{success}</div>)}

      <form onSubmit={saveProfile} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone_number" value={form.phone_number} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>

      <form onSubmit={submitPassword} className="bg-white shadow rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" name="current_password" value={passwords.current_password} onChange={handlePasswordChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" name="new_password" value={passwords.new_password} onChange={handlePasswordChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" name="confirm_password" value={passwords.confirm_password} onChange={handlePasswordChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">{saving ? 'Changing...' : 'Change Password'}</button>
        </div>
      </form>
    </div>
  );
}


