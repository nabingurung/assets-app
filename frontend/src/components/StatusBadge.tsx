import React from 'react';
import { AssetStatus } from '../types';

const styles: Record<AssetStatus, string> = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-700',
  Maintenance: 'bg-amber-100 text-amber-800',
  Retired: 'bg-slate-200 text-slate-700',
  Lost: 'bg-red-100 text-red-800',
};

const StatusBadge: React.FC<{ status: AssetStatus }> = ({ status }) => (
  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] ?? styles.Inactive}`}>
    {status}
  </span>
);

export default StatusBadge;
