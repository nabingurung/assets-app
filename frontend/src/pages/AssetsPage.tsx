import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, X, Download } from 'lucide-react';
import apiClient, { getErrorMessage } from '../api/client';
import { Asset, AssetInput, AssetStatus, ASSET_STATUSES, Category, Location } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AssetForm from '../components/AssetForm';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

const selectClass =
  'block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500';

const AssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters live in the URL so the dashboard can link straight to a filtered list.
  const searchTerm = searchParams.get('q') ?? '';
  const categoryFilter = searchParams.get('category') ?? '';
  const locationFilter = searchParams.get('location') ?? '';
  const statusFilter = (searchParams.get('status') ?? '') as AssetStatus | '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const clearFilters = () => setSearchParams({}, { replace: true });
  const hasFilters = !!(searchTerm || categoryFilter || locationFilter || statusFilter);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<Asset[]>('/assets');
      setAssets(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load assets'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dashboard links here with ?new=1 to open the add form straight away.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSelectedAsset(null);
      setIsAssetModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAssets();
    Promise.all([apiClient.get<Category[]>('/categories'), apiClient.get<Location[]>('/locations')])
      .then(([c, l]) => {
        setCategories(c.data);
        setLocations(l.data);
      })
      .catch(() => undefined);
  }, [fetchAssets]);

  const filteredAssets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return assets.filter((a) => {
      if (categoryFilter && String(a.categoryId) !== categoryFilter) return false;
      if (locationFilter && String(a.locationId) !== locationFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (!term) return true;
      return [a.name, a.sku, a.serialNumber, a.description, a.category?.name, a.location?.name]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [assets, searchTerm, categoryFilter, locationFilter, statusFilter]);

  const filteredValue = useMemo(() => filteredAssets.reduce((sum, a) => sum + (a.value ?? 0) * (a.quantity ?? 1), 0), [filteredAssets]);

  const handleOpenAddModal = () => {
    setSelectedAsset(null);
    setIsAssetModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };

  const handleCloseModal = useCallback(() => {
    setIsAssetModalOpen(false);
    setSelectedAsset(null);
  }, []);

  const handleAssetSubmit = async (formData: AssetInput) => {
    try {
      if (selectedAsset) {
        await apiClient.put(`/assets/${selectedAsset.id}`, formData);
        toast.success(`"${formData.name}" updated`);
      } else {
        await apiClient.post('/assets', formData);
        toast.success(`"${formData.name}" added`);
      }
      handleCloseModal();
      await fetchAssets();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save asset'));
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      await apiClient.delete(`/assets/${assetToDelete.id}`);
      toast.success(`"${assetToDelete.name}" deleted`);
      setAssetToDelete(null);
      await fetchAssets();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete asset'));
    }
  };

  const handleExport = async () => {
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
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export CSV'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Loading…' : `${filteredAssets.length} of ${assets.length} assets · ${formatCurrency(filteredValue)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setFilter('q', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search name, SKU, serial, description…"
            aria-label="Search assets"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setFilter('category', e.target.value)} className={selectClass} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={locationFilter} onChange={(e) => setFilter('location', e.target.value)} className={selectClass} aria-label="Filter by location">
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setFilter('status', e.target.value)} className={selectClass} aria-label="Filter by status">
          <option value="">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
            <X className="h-4 w-4 mr-1" /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Loading assets...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchAssets} className="text-sm underline">Retry</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Purchased</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Total Value</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {asset.name}
                      </Link>
                      <div className="text-xs text-gray-500">
                        {[asset.sku, asset.serialNumber].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{asset.category?.name ?? '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{asset.location?.name ?? '—'}</td>
                    <td className="px-6 py-3"><StatusBadge status={asset.status} /></td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatDate(asset.purchaseDate)}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right tabular-nums">{asset.quantity}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right tabular-nums" title={`${asset.quantity} × ${formatCurrency(asset.value)}`}>
                      {formatCurrency(asset.value * asset.quantity)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <button onClick={() => navigate(`/assets/${asset.id}`)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="View details" aria-label={`View ${asset.name}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleOpenEditModal(asset)} className="p-1.5 hover:bg-gray-200 rounded text-gray-600" title="Edit" aria-label={`Edit ${asset.name}`}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setAssetToDelete(asset)} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Delete" aria-label={`Delete ${asset.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {assets.length === 0 ? (
                      <>
                        No assets yet.{' '}
                        <button onClick={handleOpenAddModal} className="text-slate-900 font-medium underline">Add the first one</button>.
                      </>
                    ) : (
                      'No assets match the current filters.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isAssetModalOpen} onClose={handleCloseModal} title={selectedAsset ? 'Edit Asset' : 'Add New Asset'}>
        <AssetForm asset={selectedAsset} onSubmit={handleAssetSubmit} onCancel={handleCloseModal} />
      </Modal>

      <ConfirmDialog
        isOpen={!!assetToDelete}
        title="Delete asset"
        message={`Delete "${assetToDelete?.name}"? Its notes and history will be removed too. If the item still exists but is no longer used, consider setting its status to Retired instead.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteAsset}
        onCancel={() => setAssetToDelete(null)}
      />
    </div>
  );
};

export default AssetsPage;
