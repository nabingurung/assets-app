import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, Info, Edit, Trash2 } from 'lucide-react';
import apiClient, { getErrorMessage } from '../api/client';
import { Asset, AssetHistory, AssetInput, AssetNote } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import AssetForm from '../components/AssetForm';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500 shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right break-words">{children}</span>
  </div>
);

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [notes, setNotes] = useState<AssetNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const fetchAssetDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [assetRes, historyRes, notesRes] = await Promise.all([
        apiClient.get<Asset>(`/assets/${id}`),
        apiClient.get<AssetHistory[]>(`/assets/${id}/history`),
        apiClient.get<AssetNote[]>(`/assets/${id}/notes`),
      ]);
      setAsset(assetRes.data);
      setHistory(historyRes.data);
      setNotes(notesRes.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load asset details'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssetDetails();
  }, [fetchAssetDetails]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const response = await apiClient.post<AssetNote>(`/assets/${id}/notes`, { content: newNote });
      setNotes([response.data, ...notes]);
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add note'));
    } finally {
      setAddingNote(false);
    }
  };

  const handleEditSubmit = async (formData: AssetInput) => {
    try {
      await apiClient.put(`/assets/${id}`, formData);
      toast.success('Asset updated');
      setIsEditOpen(false);
      await fetchAssetDetails();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update asset'));
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/assets/${id}`);
      toast.success(`"${asset?.name}" deleted`);
      navigate('/assets');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete asset'));
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading asset details...</div>;
  if (error)
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>
        <Link to="/assets" className="text-sm text-slate-900 underline">Back to assets</Link>
      </div>
    );
  if (!asset) return <div className="text-center p-12 text-gray-500">Asset not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/assets')} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600" title="Back to Assets" aria-label="Back to assets">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <StatusBadge status={asset.status} />
              {asset.sku && <span>· {asset.sku}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditOpen(true)} className="flex items-center px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </button>
          <button onClick={() => setIsDeleteOpen(true)} className="flex items-center px-3 py-2 border border-red-200 bg-white text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4 text-gray-900 font-semibold">
              <Info className="mr-2 h-5 w-5" /> General Information
            </div>
            <div>
              <Row label="SKU / Tag">{asset.sku || '—'}</Row>
              <Row label="Serial Number">{asset.serialNumber || '—'}</Row>
              <Row label="Category">
                <Link to={`/assets?category=${asset.categoryId}`} className="hover:underline">{asset.category?.name ?? '—'}</Link>
              </Row>
              <Row label="Location">
                <Link to={`/assets?location=${asset.locationId}`} className="hover:underline">{asset.location?.name ?? '—'}</Link>
              </Row>
              <Row label="Quantity">{asset.quantity}</Row>
              <Row label="Value per unit">{formatCurrency(asset.value)}</Row>
              <Row label="Total Value">{formatCurrency(asset.value * asset.quantity)}</Row>
              <Row label="Status"><StatusBadge status={asset.status} /></Row>
              <Row label="Purchase Date">{formatDate(asset.purchaseDate)}</Row>
              <Row label="Added">{formatDateTime(asset.createdAt)}</Row>
              <Row label="Last Updated">{formatDateTime(asset.updatedAt)}</Row>
            </div>
            {asset.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{asset.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4 text-gray-900 font-semibold">
              <MessageSquare className="mr-2 h-5 w-5" /> Notes
              <span className="ml-2 text-xs font-normal text-gray-500">({notes.length})</span>
            </div>
            <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2 mb-5">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a note (condition, repairs, who borrowed it…)"
                rows={2}
                required
                aria-label="New note"
              />
              <button type="submit" disabled={addingNote || !newNote.trim()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 sm:self-end">
                {addingNote ? 'Adding…' : 'Add Note'}
              </button>
            </form>
            <div className="space-y-3">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                    <div className="text-xs text-gray-400 mt-2">
                      {note.username ? `${note.username} · ` : ''}{formatDateTime(note.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No notes yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4 text-gray-900 font-semibold">
              <Clock className="mr-2 h-5 w-5" /> Change History
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[520px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2">Field</th>
                    <th className="px-4 py-2">From</th>
                    <th className="px-4 py-2">To</th>
                    <th className="px-4 py-2">By</th>
                    <th className="px-4 py-2 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.length > 0 ? (
                    history.map((h) => (
                      <tr key={h.id} className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-gray-900">{h.fieldChanged}</td>
                        <td className="px-4 py-2 text-gray-500 line-through decoration-gray-300">{h.oldValue || '—'}</td>
                        <td className="px-4 py-2 text-gray-900">{h.newValue || '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{h.username ?? '—'}</td>
                        <td className="px-4 py-2 text-right text-gray-400 whitespace-nowrap">{formatDateTime(h.changeDate)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No changes recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Asset">
        <AssetForm asset={asset} onSubmit={handleEditSubmit} onCancel={() => setIsEditOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete asset"
        message={`Delete "${asset.name}"? Its notes and history will be removed too. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default AssetDetailPage;
