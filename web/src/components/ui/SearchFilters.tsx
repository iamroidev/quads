import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterState {
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  deliveryOption?: string;
  sort?: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

const CONDITIONS = ['', 'new', 'like-new', 'good', 'fair', 'poor'];
const DELIVERY   = ['', 'pickup', 'delivery', 'both'];
const SORTS      = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'views', label: 'Most Viewed' },
];

const fieldBase = 'w-full border-3 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] px-3 py-3 text-[12px] font-bold text-[var(--bulletin-text)] focus:outline-none shadow-[3px_3px_0_0_var(--bulletin-shadow)]';

export default function SearchFilters({ filters, onApply, onClose }: SearchFiltersProps) {
  const [local, setLocal] = useState<FilterState>({ ...filters });

  const update = (key: keyof FilterState, val: string) => setLocal(prev => ({ ...prev, [key]: val }));
  const clear = () => setLocal({});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--bulletin-text)]" />
          <h3 className="text-[13px] font-black uppercase tracking-widest text-[var(--bulletin-text)]">Filters</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:opacity-60">
          <X className="h-5 w-5 text-[var(--bulletin-text)]" />
        </button>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-2">Price Range (GHS)</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={local.minPrice || ''} onChange={e => update('minPrice', e.target.value)} className={fieldBase} />
          <input type="number" placeholder="Max" value={local.maxPrice || ''} onChange={e => update('maxPrice', e.target.value)} className={fieldBase} />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-2">Condition</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <button
              key={c || 'all'}
              onClick={() => update('condition', c)}
              className={`px-3 py-2 border-2 border-[var(--bulletin-border)] text-[10px] font-black uppercase tracking-widest transition-all ${
                local.condition === c ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)]'
              }`}
            >
              {c || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-2">Delivery</label>
        <div className="flex flex-wrap gap-2">
          {DELIVERY.map(d => (
            <button
              key={d || 'all'}
              onClick={() => update('deliveryOption', d)}
              className={`px-3 py-2 border-2 border-[var(--bulletin-border)] text-[10px] font-black uppercase tracking-widest transition-all ${
                local.deliveryOption === d ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)]'
              }`}
            >
              {d || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[2px] text-[var(--bulletin-text)] opacity-50 mb-2">Sort By</label>
        <select
          value={local.sort || ''}
          onChange={e => update('sort', e.target.value)}
          className={fieldBase}
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={clear}
          className="flex-1 border-3 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-text)] hover:opacity-70"
        >
          Clear All
        </button>
        <button
          onClick={() => { onApply(local); onClose(); }}
          className="flex-[2] border-3 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--bulletin-bg)]"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
