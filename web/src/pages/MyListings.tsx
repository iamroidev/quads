 import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Package, Eye, Edit2, Trash2, MoreVertical, Zap, Upload, Copy, BarChart3, X, Filter, ShieldOff, Printer, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import { LoadingSpinner } from '../components/ui';
import { ProductPopulated, PaginationInfo, ProductStatus } from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import { useAuth } from '../context/AuthContext';
import { BulletinEmptyState } from '../components/ui/BulletinEmptyState';

const statusStyles: Record<string, string> = {
  active: 'bg-[#fffacd] dark:bg-yellow-900/30 text-black dark:text-yellow-200',
  sold: 'bg-[#f0e8f4] dark:bg-purple-900/30 text-black dark:text-purple-200',
  reserved: 'bg-[#fff5e1] dark:bg-orange-900/30 text-black dark:text-orange-200',
  draft: 'bg-[#e0f2f7] dark:bg-sky-900/30 text-black dark:text-sky-200',
  removed: 'bg-[#fce4ec] dark:bg-red-900/30 text-black dark:text-red-200',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  sold: 'Sold',
  reserved: 'Reserved',
  draft: 'Draft',
  removed: 'Removed',
};

const MyListings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSeller = user?.roles?.includes('seller') || user?.roles?.includes('admin');
  const isUnverifiedSeller =
    user?.roles?.includes('seller') &&
    !user?.isVerified &&
    !user?.emailVerified &&
    !user?.phoneVerified;

  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importWithImages, setImportWithImages] = useState(false);
  const [previewingCSV, setPreviewingCSV] = useState(false);
  const [pendingCSVFile, setPendingCSVFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ importMode: 'shopify' | 'generic'; headers: string[]; totalRows: number; estimatedValid: number; estimatedInvalid: number; mappingHints?: Record<string, string[]>; dryRunDiff?: { toCreate: number; skipped: number } } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUpdatingStatus, setBulkUpdatingStatus] = useState(false);
  const [bulkAction, setBulkAction] = useState<'none' | 'price_adjust' | 'set_tags' | 'set_category' | 'duplicate' | 'archive'>('none');
  const [bulkPercent, setBulkPercent] = useState('10');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkCategory, setBulkCategory] = useState('others');
  const [confirmDelete, setConfirmDelete] = useState<{ mode: 'single' | 'bulk'; productId?: string; count?: number } | null>(null);
  const [selectedFlyerProduct, setSelectedFlyerProduct] = useState<ProductPopulated | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await productService.getMyListings({
        status: (statusFilter as ProductStatus) || undefined,
        page,
        limit: 20,
      });
      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [statusFilter, page]);

  useEffect(() => {
    setSelectedIds([]);
  }, [products]);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingCSVFile(file);
    setPreviewingCSV(true);
    try {
      const preview = await productService.previewCSV(file);
      if (preview.success) {
        setCsvPreview(preview.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to preview CSV');
      setPendingCSVFile(null);
      setPreviewingCSV(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runImportCSV = async () => {
    if (!pendingCSVFile) return;
    setImporting(true);
    try {
      const res = await productService.importCSV(pendingCSVFile, { withImages: importWithImages });
      toast.success(res.message);
      if (res.data.importMode) {
        toast(`${res.data.importMode.toUpperCase()} import mode${res.data.withImages ? ` • ${res.data.imagesImported || 0} images imported` : ''}`);
      }
      if (res.data.errors.length > 0) {
        toast.error(`${res.data.errors.length} items failed to import. Check console for details.`);
        console.error('Import Errors:', res.data.errors);
      }
      if (res.data.errors.length > 0) {
        const sample = res.data.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`).join('\n');
        toast.error(`Sample errors:\n${sample}`);
      }
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      setPendingCSVFile(null);
      setCsvPreview(null);
      setPreviewingCSV(false);
    }
  };

  const handleDuplicate = async (productId: string) => {
    try {
      const res = await productService.duplicateProduct(productId);
      toast.success('Listing duplicated');
      fetchListings();
    } catch {
      toast.error('Failed to duplicate listing');
    } finally {
      setOpenMenu(null);
    }
  };

  const handleDelete = async (productId: string) => {
    setConfirmDelete({ mode: 'single', productId });
  };

  const runSingleDelete = async (productId: string) => {
    setDeletingId(productId);
    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Listing deleted');
    } catch {
      toast.error('Failed to delete listing');
    } finally {
      setDeletingId(null);
      setOpenMenu(null);
      setConfirmDelete(null);
    }
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      await productService.updateProduct(productId, { status: newStatus });
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, status: newStatus as any } : p));
      toast.success(`Listing marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
    setOpenMenu(null);
  };

  const handleBoostRequest = async (productId: string) => {
    setBoostingId(productId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Boost request submitted. Admin will review your listing for featuring.');
    } catch {
      toast.error('Failed to submit boost request');
    } finally {
      setBoostingId(null);
      setOpenMenu(null);
    }
  };

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const allSelected = products.length > 0 && selectedIds.length === products.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({ mode: 'bulk', count: selectedIds.length });
  };

  const runBulkDelete = async () => {
    setBulkDeleting(true);
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await productService.deleteProduct(id);
        deleted++;
      } catch {
      }
    }
    setBulkDeleting(false);
    setSelectedIds([]);
    toast.success(`Deleted ${deleted} listing${deleted === 1 ? '' : 's'}`);
    setConfirmDelete(null);
    fetchListings();
  };

  const handleBulkStatus = async (status: 'active' | 'draft' | 'sold') => {
    if (selectedIds.length === 0) return;
    setBulkUpdatingStatus(true);
    try {
      const res = await productService.bulkUpdateStatus(selectedIds, status);
      toast.success(res.message || `Updated ${status}`);
      await fetchListings();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBulkUpdatingStatus(false);
    }
  };

  const runAdvancedBulkAction = async () => {
    if (selectedIds.length === 0 || bulkAction === 'none') return;
    try {
      const payload: any = { productIds: selectedIds, action: bulkAction };
      if (bulkAction === 'price_adjust') payload.percent = Number(bulkPercent);
      if (bulkAction === 'set_tags') payload.tags = bulkTags.split(',').map((t) => t.trim()).filter(Boolean);
      if (bulkAction === 'set_category') payload.category = bulkCategory;
      const res = await productService.bulkUpdateDetails(payload);
      toast.success(`Bulk done • ${res.data.modifiedCount || res.data.duplicatedCount}`);
      fetchListings();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk action failed');
    }
  };

  const downloadErrorTemplate = async () => {
    try {
      const blob = await productService.downloadImportErrorsTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-errors-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download error CSV template');
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  return (
    <BulletinLayout title="My Items" subtitle="Selling" section="04">
      {/* Action bar */}
      <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 md:p-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="hidden"
              />
              <button
                onClick={downloadErrorTemplate}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)]"
              >
                Error CSV template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] disabled:opacity-50"
              >
                <Upload className="inline-block h-3 w-3 mr-1" />
                {importing ? 'Importing...' : 'Import CSV'}
              </button>
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                <input
                  type="checkbox"
                  checked={importWithImages}
                  onChange={(e) => setImportWithImages(e.target.checked)}
                  className="h-3.5 w-3.5 accent-black dark:accent-white"
                />
                Images
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/seller/analytics"
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-3 py-1.5 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)]"
              >
                <BarChart3 className="inline-block h-3 w-3 mr-1" />
                My Stats
              </Link>
              <Link
                to="/sell"
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-1.5 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)]"
              >
                <Plus className="inline-block h-3 w-3 mr-1" />
                Sell Something
              </Link>
            </div>
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        {/* Verification banner for unverified sellers */}
        {isUnverifiedSeller && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-2 border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-red-900/20 p-4 shadow-[4px_4px_0_0_var(--bulletin-shadow)]">
            <ShieldOff className="h-5 w-5 flex-shrink-0 opacity-60" />
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider">Verify your account to sell</div>
              <div className="text-[11px] opacity-70 mt-0.5">
                Verify your <strong>email</strong> or <strong>phone</strong> before you can sell. Your drafts are still here.
              </div>
            </div>
            <button
              onClick={() => navigate('/verification')}
              className="flex-shrink-0 border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] transition-colors"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-0 overflow-x-auto mb-6 border-b border-[var(--bulletin-border)] scrollbar-hide">
          {['', 'active', 'draft', 'reserved', 'sold', 'removed'].map((status) => (
            <button
              key={status}
              onClick={() => updateFilter('status', status)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border-b-2 -mb-px transition-colors text-[var(--bulletin-text)] ${
                statusFilter === status
                  ? 'border-[var(--bulletin-border)]'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              {status ? statusLabels[status] : 'All'}
              {status && <span className="ml-1">({status})</span>}
            </button>
          ))}
        </div>

        {/* Bulk actions bar */}
        {products.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 shadow-[3px_3px_0_0_var(--bulletin-shadow)]">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-3.5 w-3.5 accent-black dark:accent-white" />
              Select all ({products.length})
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase opacity-60">{selectedIds.length} selected</span>
              <button
                onClick={() => handleBulkStatus('active')}
                disabled={selectedIds.length === 0 || bulkUpdatingStatus}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:bg-[#fffacd] dark:hover:bg-yellow-900/30 disabled:opacity-40"
              >
                Active
              </button>
              <button
                onClick={() => handleBulkStatus('draft')}
                disabled={selectedIds.length === 0 || bulkUpdatingStatus}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:bg-[#e0f2f7] dark:hover:bg-sky-900/30 disabled:opacity-40"
              >
                Draft
              </button>
              <button
                onClick={() => handleBulkStatus('sold')}
                disabled={selectedIds.length === 0 || bulkUpdatingStatus}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:bg-[#f0e8f4] dark:hover:bg-purple-900/30 disabled:opacity-40"
              >
                Sold
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0 || bulkDeleting}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[9px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:bg-[#fce4ec] dark:hover:bg-red-900/30 disabled:opacity-40"
              >
                <Trash2 className="inline-block h-3 w-3 mr-1" />
                Delete
              </button>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[9px] font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)]"
              >
                <option value="none">More...</option>
                <option value="price_adjust">Adjust price</option>
                <option value="set_tags">Set tags</option>
                <option value="set_category">Set category</option>
                <option value="duplicate">Duplicate</option>
                <option value="archive">Archive</option>
              </select>
              {bulkAction === 'price_adjust' && (
                <input value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} className="w-16 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)]" placeholder="10%" />
              )}
              {bulkAction === 'set_tags' && (
                <input value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} className="w-32 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)]" placeholder="tag1, tag2" />
              )}
              {bulkAction === 'set_category' && (
                <input value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="w-28 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-2 py-1 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)]" placeholder="category slug" />
              )}
              <button
                onClick={runAdvancedBulkAction}
                disabled={selectedIds.length === 0 || bulkAction === 'none'}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-2 py-1 text-[9px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] disabled:opacity-40"
              >
                Run
              </button>
            </div>
          </div>
        )}

        {/* CSV Preview modal */}
        {previewingCSV && csvPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--bulletin-border)] pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">CSV Preview</div>
                  <div className="text-lg font-bold mt-1">Check items</div>
                </div>
                <button
                  onClick={() => { setPreviewingCSV(false); setCsvPreview(null); setPendingCSVFile(null); }}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-1.5 shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-4 mb-4">
                <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                  <div className="text-[10px] opacity-60 uppercase tracking-wider">Mode</div>
                  <div className="text-[12px] font-bold uppercase mt-1">{csvPreview.importMode}</div>
                </div>
                <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                  <div className="text-[10px] opacity-60 uppercase tracking-wider">Rows</div>
                  <div className="text-[12px] font-bold mt-1">{csvPreview.totalRows} items</div>
                </div>
                <div className="border border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/30 p-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                  <div className="text-[10px] opacity-60 uppercase tracking-wider">Ready to import</div>
                  <div className="text-[12px] font-bold mt-1">{csvPreview.estimatedValid}</div>
                </div>
                <div className="border border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-red-900/30 p-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                  <div className="text-[10px] opacity-60 uppercase tracking-wider">Has errors</div>
                  <div className="text-[12px] font-bold mt-1">{csvPreview.estimatedInvalid}</div>
                </div>
              </div>
              <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 max-h-36 overflow-auto mb-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Columns</div>
                <div className="text-[11px] leading-relaxed">{csvPreview.headers.join(', ')}</div>
              </div>
              {csvPreview.mappingHints && (
                <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 mb-3 shadow-[2px_2px_0_0_var(--bulletin-shadow)]">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Mapping hints</div>
                  <div className="space-y-1 text-[11px]">
                    {Object.entries(csvPreview.mappingHints).map(([k, v]) => (
                      <div key={k}><span className="font-bold uppercase">{k}:</span> {v.join(', ')}</div>
                    ))}
                  </div>
                </div>
              )}
              {csvPreview.dryRunDiff && (
                <div className="text-[11px] opacity-60 mb-4">Dry run: create {csvPreview.dryRunDiff.toCreate}, skip {csvPreview.dryRunDiff.skipped}</div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setPreviewingCSV(false); setCsvPreview(null); setPendingCSVFile(null); }}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={runImportCSV}
                  disabled={importing}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] disabled:opacity-50 transition-all"
                >
                  {importing ? 'Importing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[8px_8px_0_0_var(--bulletin-shadow)] max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--bulletin-border)] pb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-60">Confirm</div>
                  <div className="text-lg font-bold mt-1">This cannot be undone</div>
                </div>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-1.5 shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-[12px] mb-6">
                {confirmDelete.mode === 'single'
                  ? 'Delete this item forever?'
                  : `Delete these ${confirmDelete.count || selectedIds.length} items forever?`}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.mode === 'single' && confirmDelete.productId) {
                      runSingleDelete(confirmDelete.productId);
                      return;
                    }
                    runBulkDelete();
                  }}
                  disabled={bulkDeleting || !!deletingId}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] disabled:opacity-50 transition-all"
                >
                  {bulkDeleting || deletingId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <LoadingSpinner text="Loading your listings..." />
        ) : products.length === 0 ? (
          <BulletinEmptyState
            title={statusFilter ? `No ${statusFilter} items` : "Nothing for Sale Yet"}
            message={statusFilter 
              ? `You don't have any items currently marked as ${statusFilter}.` 
              : "You haven't listed anything yet. Start selling by adding your first item."
            }
            icon={<Package className="h-12 w-12 opacity-20" />}
            action={
              <Link
                to="/sell"
                className="inline-block border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-8 py-3 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] transition-all hover:-translate-y-1 shadow-[4px_4px_0_0_var(--bulletin-shadow)]"
              >
                <Plus className="inline-block h-3 w-3 mr-2" />
                Add Item
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const mainImage = product.images.length > 0
                ? product.images[0].url
                : `https://placehold.co/100x100/e2e8f0/64748b?text=${encodeURIComponent(product.title.slice(0, 8))}`;

              return (
                <div
                  key={product._id}
                  className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-3 shadow-[3px_3px_0_0_var(--bulletin-shadow)]"
                  style={{ transform: `rotate(${Math.random() * 0.4 - 0.2}deg)` }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product._id)}
                      onChange={() => toggleSelect(product._id)}
                      className="h-4 w-4 accent-black dark:accent-white flex-shrink-0"
                    />
                    {/* Image */}
                    <Link to={`/products/${product._id}`} className="flex-shrink-0 border border-[var(--bulletin-border)]">
                      <div className="w-14 h-14 overflow-hidden bg-[var(--bulletin-bg)]">
                        <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${product._id}`}
                          className="text-[12px] font-bold line-clamp-1 hover:underline"
                        >
                          {product.title}
                        </Link>
                        {product.isFeatured && (
                          <span className="flex-shrink-0 border border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/30 px-1.5 py-0.5 text-[8px] font-bold uppercase flex items-center gap-0.5 shadow-[1px_1px_0_0_var(--bulletin-shadow)]">
                            <Zap className="h-2.5 w-2.5" />
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] font-bold mt-0.5">
                        GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`border border-[var(--bulletin-border)] px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusStyles[product.status]}`}>
                          {statusLabels[product.status]}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] opacity-60">
                          <Eye className="h-3 w-3" />
                          {product.views}
                        </span>
                        <span className="text-[10px] opacity-60">{new Date(product.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {product.status === 'active' && !product.isFeatured && (
                        <button
                          onClick={() => handleBoostRequest(product._id)}
                          disabled={boostingId === product._id}
                          className="border border-[var(--bulletin-border)] bg-[#fffacd] dark:bg-yellow-900/30 px-2 py-1 text-[8px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] disabled:opacity-40 transition-all hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)]"
                        >
                          <Zap className="inline-block h-2.5 w-2.5 mr-0.5" />
                          {boostingId === product._id ? '...' : 'Promote'}
                        </button>
                      )}
                      <Link
                        to={`/products/${product._id}/edit`}
                        className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-1.5 text-[10px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === product._id ? null : product._id)}
                          className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-1.5 text-[10px] font-bold uppercase shadow-[1px_1px_0_0_var(--bulletin-shadow)] hover:shadow-[2px_2px_0_0_var(--bulletin-shadow)] transition-all"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {openMenu === product._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] z-20 py-1 min-w-[150px]">
                              {product.status !== 'active' && (
                                <button
                                  onClick={() => handleStatusChange(product._id, 'active')}
                                  className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#fffacd] dark:hover:bg-yellow-900/30"
                                >
                                  Mark Active
                                </button>
                              )}
                              {product.status !== 'sold' && (
                                <button
                                  onClick={() => handleStatusChange(product._id, 'sold')}
                                  className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#f0e8f4] dark:hover:bg-purple-900/30"
                                >
                                  Mark Sold
                                </button>
                              )}
                              {product.status !== 'reserved' && (
                                <button
                                  onClick={() => handleStatusChange(product._id, 'reserved')}
                                  className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#fff5e1] dark:hover:bg-orange-900/30"
                                >
                                  Mark Reserved
                                </button>
                              )}
                              {!product.isFeatured && product.status === 'active' && (
                                <button
                                  onClick={() => handleBoostRequest(product._id)}
                                  disabled={boostingId === product._id}
                                  className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#fffacd] dark:hover:bg-yellow-900/30 disabled:opacity-40"
                                >
                                  <Zap className="inline-block h-3 w-3 mr-1" />
                                  {boostingId === product._id ? 'Requesting...' : 'Promote Item'}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedFlyerProduct(product);
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#fffacd] dark:hover:bg-yellow-900/30 flex items-center gap-1"
                              >
                                <QrCode className="h-3.5 w-3.5 mr-0.5" />
                                Polaroid Flyer
                              </button>
                              <button
                                onClick={() => handleDuplicate(product._id)}
                                className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#e0f2f7] dark:hover:bg-sky-900/30 flex items-center gap-1"
                              >
                                <Copy className="h-3.5 w-3.5 mr-0.5" />
                                Copy
                              </button>
                              <div className="border-t border-[var(--bulletin-border)] my-1" />
                              <button
                                onClick={() => handleDelete(product._id)}
                                disabled={deletingId === product._id}
                                className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-[#fce4ec] dark:hover:bg-red-900/30 flex items-center gap-1 disabled:opacity-40"
                              >
                                <Trash2 className="h-3 w-3" />
                                {deletingId === product._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-[var(--bulletin-border)]">
            {page > 1 && (
              <button
                onClick={() => updateFilter('page', String(page - 1))}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
              >
                Previous
              </button>
            )}
            <span className="text-[10px] font-bold uppercase opacity-60">
              {page} / {pagination.pages}
            </span>
            {page < pagination.pages && (
              <button
                onClick={() => updateFilter('page', String(page + 1))}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
              >
                Next
              </button>
            )}
          </div>
        )}

        {/* Polaroid Flyer QR Generator Modal */}
        {selectedFlyerProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="border-4 border-black bg-[#faf8f5] dark:bg-[#181818] shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:shadow-[12px_12px_0_0_rgba(255,255,255,1)] max-w-2xl w-full p-6 relative my-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedFlyerProduct(null)}
                className="absolute right-4 top-4 border-2 border-black bg-white dark:bg-black p-1.5 shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:shadow-[1px_1px_0_0_var(--bulletin-shadow)] transition-all z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5 border-b-2 border-black pb-3 text-black dark:text-white">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#ff6b6b]">Marketing growth loops</div>
                <h3 className="text-xl font-black uppercase mt-0.5 font-mono">Polaroid Flyer Generator</h3>
                <p className="text-[10px] opacity-70 mt-1 uppercase font-bold">Print this physical flyer and paste it on hostel bulletin boards to drive local traffic!</p>
              </div>

              {/* Flex columns: Controls (left) & Digital Preview (right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* ── Left side: Controls ── */}
                <div className="md:col-span-5 space-y-4 font-mono text-black dark:text-white">
                  <div className="border-2 border-black bg-[#fffacd] p-3 shadow-[4px_4px_0_0_black]">
                    <div className="text-[10px] font-black uppercase mb-1 text-black">💡 Campus Growth Strategy</div>
                    <p className="text-[9px] leading-relaxed text-black/80">
                      Physical bulletin boards inside UMaT hostels are high-traffic hubs. QR flyers create a highly tactile, local bridge directly to your digital shop!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase block">Custom Pickup Hostel Location:</label>
                    <input 
                      type="text" 
                      defaultValue={selectedFlyerProduct.pickupLocation || user?.residenceHall || ''}
                      id="flyer-pickup-input"
                      className="w-full border-2 border-black bg-white dark:bg-black p-2 text-xs font-bold uppercase focus:ring-0 focus:outline-none focus:border-[#ff6b6b] text-black dark:text-white"
                      placeholder="e.g. Gold & Black Hall"
                      onChange={(e) => {
                        setSelectedFlyerProduct(prev => prev ? { ...prev, pickupLocation: e.target.value } : null);
                      }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      const mainImage = selectedFlyerProduct.images[0]?.url || `https://placehold.co/400x300/f3f5f7/9ba3a7?text=${encodeURIComponent(selectedFlyerProduct.title.slice(0, 15))}`;
                      
                      // Find the rendered QR code SVG inside the preview block
                      const qrElement = document.getElementById(`qr-code-svg-flyer-${selectedFlyerProduct._id}`);
                      const qrSvgMarkup = qrElement ? qrElement.outerHTML : '';

                      // Open native print dialogue with custom high fidelity print template
                      const printWindow = window.open('', '_blank', 'width=800,height=1000');
                      if (!printWindow) {
                        toast.error('Popup blocked! Please allow popups to download and print the flyer.');
                        return;
                      }

                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Polaroid Flyer - ${selectedFlyerProduct.title}</title>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>
                              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700;800&family=Fraunces:wght@700;900&display=swap');
                              body {
                                background-color: #faf8f5;
                                color: #000000;
                                font-family: 'JetBrains Mono', monospace;
                                padding: 40px;
                                margin: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                min-height: 100vh;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                              }
                              .flyer-card {
                                border: 8px solid #000000;
                                background-color: #ffffff;
                                padding: 35px;
                                width: 550px;
                                box-shadow: 16px 16px 0px 0px #000000;
                                position: relative;
                              }
                              .bulletin-badge {
                                background-color: #ff6b6b;
                                color: white;
                                font-weight: 800;
                                font-size: 11px;
                                letter-spacing: 0.1em;
                                text-transform: uppercase;
                                padding: 5px 12px;
                                border: 2px solid #000000;
                                display: inline-block;
                              }
                              @media print {
                                body {
                                  padding: 0;
                                  background-color: #ffffff;
                                }
                                .flyer-card {
                                  box-shadow: none;
                                  border-width: 6px;
                                  width: 100%;
                                  max-width: 100%;
                                  height: 100%;
                                  margin: 0;
                                  padding: 30px;
                                }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="flyer-card">
                              <!-- Top Pin Detail -->
                              <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); width: 32px; height: 32px; border-radius: 50%; background-color: #ff6b6b; border: 4px solid #000000; box-shadow: inset -4px -4px 0px rgba(0,0,0,0.35);"></div>
                              
                              <!-- Header -->
                              <div class="text-center border-b-4 border-black pb-4 mb-6">
                                <h1 class="text-4xl font-extrabold tracking-tighter" style="font-family: 'Fraunces', serif;">QUADS</h1>
                                <p class="text-[11px] font-black uppercase tracking-widest mt-1 text-[#ff6b6b]">UMaT Official Student Marketplace</p>
                              </div>
                              
                              <!-- Polaroid Picture -->
                              <div class="border-4 border-black overflow-hidden bg-gray-100 aspect-[4/3] mb-6 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                                <img src="${mainImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                              </div>
                              
                              <!-- Content details -->
                              <div class="space-y-4">
                                <div class="flex justify-between items-start gap-4">
                                  <h2 class="text-2xl font-extrabold uppercase tracking-tight line-clamp-2" style="font-family: 'JetBrains Mono', monospace;">${selectedFlyerProduct.title}</h2>
                                  <span class="text-xl font-black bg-[#fffacd] px-3.5 py-1.5 border-2 border-black whitespace-nowrap shadow-[3px_3px_0_0_#000000]">
                                    GHS ${selectedFlyerProduct.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                
                                <p class="text-[12px] text-gray-700 line-clamp-3 bg-gray-50 border-2 border-black/10 p-3 italic">
                                  "${selectedFlyerProduct.description}"
                                </p>
                                
                                <div class="grid grid-cols-12 gap-4 border-t-2 border-dashed border-black pt-4">
                                  <!-- Info List -->
                                  <div class="col-span-7 space-y-3 text-[11px] font-bold uppercase">
                                    <div>
                                      <span class="opacity-50 text-[10px]">Condition rating:</span>
                                      <div class="border-2 border-black bg-white px-2 py-0.5 mt-0.5 inline-block text-[10px]">${selectedFlyerProduct.condition}</div>
                                    </div>
                                    ${selectedFlyerProduct.pickupLocation ? `
                                    <div>
                                      <span class="opacity-50 text-[10px]">Campus Pickup Point:</span>
                                      <div class="border-2 border-black bg-[#e0f2f7] px-2 py-0.5 mt-0.5 inline-block text-[10px] text-sky-950">${selectedFlyerProduct.pickupLocation}</div>
                                    </div>
                                    ` : ''}
                                  </div>
                                  
                                  <!-- QR Box -->
                                  <div class="col-span-5 flex flex-col items-center justify-center text-center">
                                    <div class="border-4 border-black p-2 bg-white shadow-[3px_3px_0_0_#000000]">
                                      ${qrSvgMarkup}
                                    </div>
                                    <span class="text-[8px] font-black uppercase mt-1 tracking-wider text-black opacity-80">Scan QR Code to Buy</span>
                                  </div>
                                </div>
                                
                                <!-- Escrow Badge -->
                                <div class="mt-6 border-t-4 border-black pt-4 text-center">
                                  <span class="bulletin-badge">🔐 ESCROW PROTECTED TRANSACTION</span>
                                  <p class="text-[9px] font-bold opacity-60 mt-1.5 uppercase tracking-wider">Payments held securely in escrow until item verification. No scams.</p>
                                </div>
                              </div>
                            </div>
                            <script>
                              window.onload = function() {
                                setTimeout(function() {
                                  window.print();
                                }, 500);
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      toast.success('Print page loaded successfully');
                    }}
                    className="w-full border-4 border-black bg-[var(--bulletin-text)] px-4 py-3 text-[11px] font-black uppercase text-[var(--bulletin-bg)] shadow-[4px_4px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Flyer / PDF
                  </button>
                </div>

                {/* ── Right side: Digital Poster Preview ── */}
                <div className="md:col-span-7 flex justify-center">
                  <div 
                    id="printable-flyer-area"
                    className="border-4 border-black bg-white p-5 w-full max-w-[340px] shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative font-mono text-black text-left"
                  >
                    {/* Visual pinned look */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#ff6b6b] border-4 border-black z-10" />

                    {/* Logo Header */}
                    <div className="text-center border-b-2 border-black pb-2 mb-4">
                      <h4 className="text-xl font-black tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>QUADS</h4>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#ff6b6b]">UMaT Peer-to-Peer Market</p>
                    </div>

                    {/* Image box */}
                    <div className="border-2 border-black aspect-[4/3] overflow-hidden bg-gray-50 mb-3.5">
                      <img 
                        src={selectedFlyerProduct.images[0]?.url || `https://placehold.co/400x300/f3f5f7/9ba3a7?text=${encodeURIComponent(selectedFlyerProduct.title.slice(0, 15))}`} 
                        alt="Product flyer preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Title & Price */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="text-[12px] font-black uppercase leading-tight line-clamp-2">{selectedFlyerProduct.title}</h5>
                        <span className="text-[10px] font-black bg-[#fffacd] px-2 py-0.5 border-2 border-black whitespace-nowrap">
                          GHS {selectedFlyerProduct.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Description snippet */}
                      <p className="text-[9px] text-gray-600 italic line-clamp-2 bg-gray-50 border border-black/5 p-2">
                        "{selectedFlyerProduct.description || 'No description provided.'}"
                      </p>

                      {/* Grid for parameters + QR code */}
                      <div className="grid grid-cols-12 gap-2 border-t border-dashed border-black pt-3">
                        <div className="col-span-7 space-y-2 text-[8px] font-black uppercase">
                          <div>
                            <span className="opacity-50 block">Condition:</span>
                            <span className="border border-black px-1 py-0.2 mt-0.5 inline-block bg-white">{selectedFlyerProduct.condition}</span>
                          </div>
                          {selectedFlyerProduct.pickupLocation && (
                            <div>
                              <span className="opacity-50 block">Hostel Point:</span>
                              <span className="border border-black px-1 py-0.2 mt-0.5 inline-block bg-[#e0f2f7] truncate max-w-full">{selectedFlyerProduct.pickupLocation}</span>
                            </div>
                          )}
                        </div>

                        {/* QR Code SVG rendering from qrcode.react */}
                        <div className="col-span-5 flex flex-col items-center justify-center">
                          <div className="border-2 border-black p-1 bg-white">
                            <QRCodeSVG 
                              id={`qr-code-svg-flyer-${selectedFlyerProduct._id}`}
                              value={`${window.location.origin}/products/${selectedFlyerProduct._id}`}
                              size={64}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                          <span className="text-[6px] font-black uppercase mt-1 opacity-70">Scan code</span>
                        </div>
                      </div>

                      {/* Footer lock */}
                      <div className="border-t-2 border-black pt-2 text-center">
                        <span className="bg-[#ff6b6b] text-white text-[7px] font-black uppercase tracking-wider px-2 py-0.5 border border-black inline-block">
                          🔐 Escrow Safeguarded
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </BulletinSection>
    </BulletinLayout>
  );
};

export default MyListings;