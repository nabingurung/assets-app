import React, { useCallback, useEffect, useState } from 'react';
import { Shield, Download, Database, Key, RefreshCw } from 'lucide-react';
import apiClient, { getErrorMessage } from '../api/client';
import { BackupInfo } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatBytes, formatDateTime } from '../utils/format';

const inputClass = 'block w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500';

const AdminPage: React.FC = () => {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadBackups = useCallback(async () => {
    try {
      setBackupsLoading(true);
      const res = await apiClient.get<BackupInfo[]>('/admin/backups');
      setBackups(res.data);
    } catch {
      // Non-fatal; the list simply stays empty.
    } finally {
      setBackupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/admin/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bts_assets_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV export downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export CSV'));
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await apiClient.post<{ message: string }>('/admin/backup');
      toast.success(res.data.message);
      await loadBackups();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Backup failed'));
    } finally {
      setBackingUp(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (passwords.next.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await apiClient.put('/admin/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success('Password changed. Please sign in again with the new password.');
      setPasswords({ current: '', next: '', confirm: '' });
      window.setTimeout(logout, 1500);
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Failed to change password'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-slate-900" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-sm text-gray-500">Exports, backups, and account security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
            <p className="text-sm text-gray-600">Export every asset to a CSV spreadsheet you can open in Excel or Google Sheets.</p>
            <button onClick={handleExportCsv} disabled={exporting} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60">
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export Assets CSV'}
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
            <p className="text-sm text-gray-600">
              Create a snapshot of the database. Backups are saved in the <code className="text-xs bg-gray-200 px-1 rounded">data/backups</code> folder next to the database file, so copy that folder to a USB drive from time to time.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleBackup} disabled={backingUp} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60">
                <Database className="mr-2 h-4 w-4" />
                {backingUp ? 'Backing up…' : 'Back Up Database Now'}
              </button>
              <button onClick={loadBackups} className="flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-100 text-sm" aria-label="Refresh backup list">
                <RefreshCw className={`h-4 w-4 ${backupsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="pt-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Existing backups ({backups.length})</div>
              {backupsLoading && backups.length === 0 ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : backups.length === 0 ? (
                <p className="text-sm text-gray-400">No backups yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white max-h-56 overflow-y-auto">
                  {backups.map((b) => (
                    <li key={b.fileName} className="flex justify-between items-center px-3 py-2 text-sm">
                      <span className="font-mono text-xs text-gray-700 truncate">{b.fileName}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                        {formatBytes(b.sizeBytes)} · {formatDateTime(b.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          </div>
          <p className="text-sm text-gray-600">
            Change the password for <span className="font-medium text-gray-900">{user?.username}</span>. You will be signed out afterwards.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="pw-current" className="text-sm font-medium text-gray-700">Current Password</label>
              <input id="pw-current" type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className={inputClass} required />
            </div>
            <div className="space-y-1">
              <label htmlFor="pw-new" className="text-sm font-medium text-gray-700">New Password</label>
              <input id="pw-new" type="password" autoComplete="new-password" minLength={6} value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className={inputClass} required />
            </div>
            <div className="space-y-1">
              <label htmlFor="pw-confirm" className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <input id="pw-confirm" type="password" autoComplete="new-password" minLength={6} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className={inputClass} required />
            </div>
            {passwordError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{passwordError}</div>}
            <button type="submit" disabled={changingPassword} className="w-full py-2 px-4 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm disabled:opacity-60">
              {changingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
