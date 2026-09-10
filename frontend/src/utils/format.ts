export const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value ?? 0);

/** Server timestamps are UTC but may arrive without a trailing Z; normalise before parsing. */
const parseServerDate = (value: string) => {
  const hasZone = /Z$|[+-]\d\d:\d\d$/.test(value);
  return new Date(hasZone || value.length <= 10 ? value : `${value}Z`);
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value.substring(0, 10) + 'T00:00:00');
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = parseServerDate(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Turns an ISO date-time into the yyyy-MM-dd form an <input type="date"> needs. */
export const toDateInput = (value: string | null | undefined) => (value ? value.substring(0, 10) : '');
