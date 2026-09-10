import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, LucideIcon } from 'lucide-react';
import apiClient, { getErrorMessage } from '../api/client';
import { Asset } from '../types';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';

interface LookupItem {
  id: number;
  name: string;
  description?: string | null;
}

interface LookupManagerProps {
  /** e.g. "Category" */
  singular: string;
  /** e.g. "Categories" */
  plural: string;
  /** API path, e.g. "/categories" */
  endpoint: string;
  /** Query-string key used by the assets list filter, e.g. "category" */
  assetFilterKey: 'category' | 'location';
  Icon: LucideIcon;
  intro: string;
}

/**
 * Generic add / edit / delete screen shared by Categories and Locations.
 * Both are simple name + description lookups, so one component covers both.
 */
const LookupManager: React.FC<LookupManagerProps> = ({ singular, plural, endpoint, assetFilterKey, Icon, intro }) => {
  const toast = useToast();
  const [items, setItems] = useState<LookupItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<LookupItem | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [itemsRes, assetsRes] = await Promise.all([apiClient.get<LookupItem[]>(endpoint), apiClient.get<Asset[]>('/assets')]);
      setItems(itemsRes.data);
      setAssets(assetsRes.data);
    } catch (err) {
      setError(getErrorMessage(err, `Failed to load ${plural.toLowerCase()}`));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, plural]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const usage = useMemo(() => {
    const counts = new Map<number, number>();
    const key = assetFilterKey === 'category' ? 'categoryId' : 'locationId';
    for (const a of assets) counts.set(a[key], (counts.get(a[key]) ?? 0) + 1);
    return counts;
  }, [assets, assetFilterKey]);

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: LookupItem) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description ?? '' });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditing(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { name, description: form.description.trim() || null };
      if (editing) {
        await apiClient.put(`${endpoint}/${editing.id}`, { id: editing.id, ...payload });
        toast.success(`${singular} "${name}" updated`);
      } else {
        await apiClient.post(endpoint, payload);
        toast.success(`${singular} "${name}" added`);
      }
      closeForm();
      await fetchAll();
    } catch (err) {
      setFormError(getErrorMessage(err, `Failed to save ${singular.toLowerCase()}`));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await apiClient.delete(`${endpoint}/${toDelete.id}`);
      toast.success(`${singular} "${toDelete.name}" deleted`);
      setToDelete(null);
      await fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to delete ${singular.toLowerCase()}`));
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{plural}</h1>
          <p className="text-sm text-gray-500 mt-1">{intro}</p>
        </div>
        <button onClick={openAdd} className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
          <Plus className="mr-2 h-5 w-5" />
          Add {singular}
        </button>
      </div>

      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder={`Search ${plural.toLowerCase()}...`}
          aria-label={`Search ${plural.toLowerCase()}`}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Loading {plural.toLowerCase()}...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchAll} className="text-sm underline">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">{singular}</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Assets</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const count = usage.get(item.id) ?? 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-400" />
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{item.description || <span className="text-gray-400">No description</span>}</td>
                      <td className="px-6 py-3 text-sm text-right">
                        {count > 0 ? (
                          <Link to={`/assets?${assetFilterKey}=${item.id}`} className="text-slate-900 font-medium hover:underline tabular-nums">
                            {count}
                          </Link>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Edit" aria-label={`Edit ${item.name}`}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setToDelete(item)}
                            disabled={count > 0}
                            className="p-1.5 rounded text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            title={count > 0 ? `Cannot delete: ${count} asset(s) use this ${singular.toLowerCase()}` : 'Delete'}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No {plural.toLowerCase()} found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={closeForm} title={editing ? `Edit ${singular}` : `Add ${singular}`} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="lookup-name" className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lookup-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lookup-desc" className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="lookup-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="block w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              maxLength={500}
            />
          </div>
          {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{formError}</div>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={closeForm} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save Changes' : `Create ${singular}`}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!toDelete}
        title={`Delete ${singular.toLowerCase()}`}
        message={`Delete "${toDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default LookupManager;
