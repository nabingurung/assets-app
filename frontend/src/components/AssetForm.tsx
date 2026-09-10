import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Asset, AssetInput, AssetStatus, ASSET_STATUSES, Category, Location } from '../types';
import { toDateInput } from '../utils/format';

interface AssetFormProps {
  asset?: Asset | null;
  onSubmit: (asset: AssetInput) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  name: string;
  sku: string;
  serialNumber: string;
  categoryId: string;
  locationId: string;
  purchaseDate: string;
  quantity: string;
  value: string;
  status: AssetStatus;
  description: string;
}

const emptyForm: FormState = {
  name: '',
  sku: '',
  serialNumber: '',
  categoryId: '',
  locationId: '',
  purchaseDate: '',
  quantity: '1',
  value: '0',
  status: 'Active',
  description: '',
};

const inputClass =
  'block w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500';

const AssetForm: React.FC<AssetFormProps> = ({ asset, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.get<Category[]>('/categories'), apiClient.get<Location[]>('/locations')])
      .then(([catRes, locRes]) => {
        setCategories(catRes.data);
        setLocations(locRes.data);
      })
      .catch(() => setError('Could not load categories and locations.'));
  }, []);

  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name,
        sku: asset.sku ?? '',
        serialNumber: asset.serialNumber ?? '',
        categoryId: String(asset.categoryId),
        locationId: String(asset.locationId),
        purchaseDate: toDateInput(asset.purchaseDate),
        quantity: String(asset.quantity ?? 1),
        value: String(asset.value ?? 0),
        status: asset.status,
        description: asset.description ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [asset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.categoryId || !form.locationId) {
      setError('Please choose a category and a location.');
      return;
    }
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Quantity is required and must be a whole number greater than 0.');
      return;
    }
    const value = parseFloat(form.value);
    if (isNaN(value) || value < 0) {
      setError('Value must be zero or a positive number.');
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        sku: form.sku.trim(),
        serialNumber: form.serialNumber.trim(),
        categoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        purchaseDate: form.purchaseDate ? form.purchaseDate : null,
        quantity,
        value,
        status: form.status,
        description: form.description.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="asset-name" className="text-sm font-medium text-gray-700">
            Asset Name <span className="text-red-500">*</span>
          </label>
          <input id="asset-name" type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} required autoFocus />
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-sku" className="text-sm font-medium text-gray-700">SKU / Tag</label>
          <input id="asset-sku" type="text" name="sku" value={form.sku} onChange={handleChange} className={inputClass} placeholder="e.g. BTS-CH-001" />
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-serial" className="text-sm font-medium text-gray-700">Serial Number</label>
          <input id="asset-serial" type="text" name="serialNumber" value={form.serialNumber} onChange={handleChange} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-category" className="text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select id="asset-category" name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass} required>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-location" className="text-sm font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <select id="asset-location" name="locationId" value={form.locationId} onChange={handleChange} className={inputClass} required>
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-status" className="text-sm font-medium text-gray-700">Status</label>
          <select id="asset-status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-quantity" className="text-sm font-medium text-gray-700">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input id="asset-quantity" type="number" name="quantity" min="1" step="1" value={form.quantity} onChange={handleChange} className={inputClass} required />
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-value" className="text-sm font-medium text-gray-700">Value per unit ($)</label>
          <input id="asset-value" type="number" name="value" min="0" step="0.01" value={form.value} onChange={handleChange} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="asset-date" className="text-sm font-medium text-gray-700">Purchase Date</label>
          <input id="asset-date" type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="asset-desc" className="text-sm font-medium text-gray-700">Description</label>
        <textarea id="asset-desc" name="description" value={form.description} onChange={handleChange} className={inputClass} rows={3} />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60"
        >
          {busy ? 'Saving...' : asset ? 'Save Changes' : 'Create Asset'}
        </button>
      </div>
    </form>
  );
};

export default AssetForm;
