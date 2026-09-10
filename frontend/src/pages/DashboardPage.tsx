import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, DollarSign, FolderTree, MapPin, Plus, ArrowRight, Wrench, AlertTriangle, CheckCircle2, Archive, PauseCircle, Sparkles, Activity } from 'lucide-react';
import apiClient, { getErrorMessage } from '../api/client';
import { DashboardSummary, ActivityItem, NamedCount, AssetStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/format';

/* ---------- small presentational pieces ---------- */

const StatTile: React.FC<{ label: string; value: string; hint?: string; Icon: typeof Package; to?: string }> = ({ label, value, hint, Icon, to }) => {
  const body = (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col justify-between hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="p-1.5 bg-gray-100 text-gray-600 rounded-lg">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{body}</Link> : body;
};

/**
 * Single-series horizontal bar list. One hue (slate) because every bar is the same
 * measure; counts are labelled directly so no legend or axis is needed.
 */
const BarList: React.FC<{ items: NamedCount[]; total: number; linkBase: string; lookupIds: Map<string, number> }> = ({ items, total, linkBase, lookupIds }) => {
  if (items.length === 0) return <p className="text-sm text-gray-500 py-6 text-center">Nothing to show yet.</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const id = lookupIds.get(item.name);
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const label = (
          <span className="text-sm text-gray-700 truncate">{item.name}</span>
        );
        return (
          <li key={item.name} title={`${item.name}: ${item.count} asset${item.count === 1 ? '' : 's'} (${pct}%), ${formatCurrency(item.value)}`}>
            <div className="flex justify-between items-baseline gap-3 mb-1">
              {id !== undefined ? <Link to={`${linkBase}${id}`} className="hover:underline truncate">{label}</Link> : label}
              <span className="text-sm text-gray-900 tabular-nums shrink-0">
                {item.count} <span className="text-gray-400 text-xs">· {formatCurrency(item.value)}</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-sm h-2" role="presentation">
              <div className="bg-slate-700 h-2 rounded-sm transition-all duration-500" style={{ width: `${Math.max((item.count / max) * 100, 2)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const statusMeta: { key: AssetStatus; field: keyof DashboardSummary; color: string; Icon: typeof Package }[] = [
  { key: 'Active', field: 'activeAssets', color: 'bg-green-600', Icon: CheckCircle2 },
  { key: 'Maintenance', field: 'maintenanceAssets', color: 'bg-amber-500', Icon: Wrench },
  { key: 'Inactive', field: 'inactiveAssets', color: 'bg-gray-400', Icon: PauseCircle },
  { key: 'Retired', field: 'retiredAssets', color: 'bg-slate-500', Icon: Archive },
  { key: 'Lost', field: 'lostAssets', color: 'bg-red-600', Icon: AlertTriangle },
];

/* ---------- page ---------- */

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lookupIds, setLookupIds] = useState<{ categories: Map<string, number>; locations: Map<string, number> }>({
    categories: new Map(),
    locations: new Map(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [summaryRes, activityRes, catRes, locRes] = await Promise.all([
        apiClient.get<DashboardSummary>('/dashboard/summary'),
        apiClient.get<ActivityItem[]>('/dashboard/activity', { params: { take: 15 } }),
        apiClient.get<{ id: number; name: string }[]>('/categories'),
        apiClient.get<{ id: number; name: string }[]>('/locations'),
      ]);
      setSummary(summaryRes.data);
      setActivities(activityRes.data);
      setLookupIds({
        categories: new Map(catRes.data.map((c) => [c.name, c.id])),
        locations: new Map(locRes.data.map((l) => [l.name, l.id])),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>;
  if (error || !summary)
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex justify-between items-center">
        <span>{error ?? 'No data'}</span>
        <button onClick={fetchData} className="text-sm underline">Retry</button>
      </div>
    );

  const total = summary.totalAssets;
  const needsAttention = summary.maintenanceAssets + summary.lostAssets;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of Baltimore Tamu Samaj assets</p>
        </div>
        <Link to="/assets?new=1" className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
          <Plus className="mr-2 h-5 w-5" />
          Add Asset
        </Link>
      </div>

      {total === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Sparkles className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Welcome to BTS Assets</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            No assets have been recorded yet. Start by adding the furniture, electronics, and equipment BTS owns. Categories and locations are already set up and can be edited any time.
          </p>
          <Link to="/assets" className="inline-flex items-center mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
            Go to Assets <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Assets" value={String(total)} hint={`${summary.totalQuantity} items · ${summary.addedLast30Days} added in last 30 days`} Icon={Package} to="/assets" />
        <StatTile label="Total Value" value={formatCurrency(summary.totalValue)} hint="Quantity × unit value, all assets" Icon={DollarSign} to="/assets" />
        <StatTile label="Categories" value={String(summary.totalCategories)} hint={`${summary.categoryDistribution.length} in use`} Icon={FolderTree} to="/categories" />
        <StatTile label="Locations" value={String(summary.totalLocations)} hint={`${summary.locationDistribution.length} in use`} Icon={MapPin} to="/locations" />
      </div>

      {/* Status breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Asset Status</h3>
          {needsAttention > 0 ? (
            <Link to="/assets?status=Maintenance" className="text-sm text-amber-700 hover:underline flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" /> {needsAttention} need attention
            </Link>
          ) : (
            <span className="text-sm text-gray-500">All assets accounted for</span>
          )}
        </div>
        {total > 0 && (
          <div className="flex h-3 rounded-sm overflow-hidden gap-[2px] mb-4" role="img" aria-label="Asset status distribution">
            {statusMeta.map(({ key, field, color }) => {
              const count = summary[field] as number;
              if (!count) return null;
              return <div key={key} className={color} style={{ width: `${(count / total) * 100}%` }} title={`${key}: ${count}`} />;
            })}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statusMeta.map(({ key, field, color, Icon }) => {
            const count = summary[field] as number;
            return (
              <Link key={key} to={`/assets?status=${key}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                <span className={`h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden="true" />
                <Icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 flex-1">{key}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assets by Category</h3>
            <Link to="/categories" className="text-sm text-gray-500 hover:text-gray-900">Manage</Link>
          </div>
          <BarList items={summary.categoryDistribution} total={total} linkBase="/assets?category=" lookupIds={lookupIds.categories} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assets by Location</h3>
            <Link to="/locations" className="text-sm text-gray-500 hover:text-gray-900">Manage</Link>
          </div>
          <BarList items={summary.locationDistribution} total={total} linkBase="/assets?location=" lookupIds={lookupIds.locations} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recently added */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-baseline mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recently Added</h3>
            <Link to="/assets" className="text-sm text-gray-500 hover:text-gray-900">View all</Link>
          </div>
          {summary.recentAssets.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No assets yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {summary.recentAssets.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/assets/${a.id}`} className="text-sm font-medium text-gray-900 hover:underline truncate block">{a.name}</Link>
                    <div className="text-xs text-gray-500 truncate">
                      {a.category?.name ?? '—'} · {a.location?.name ?? '—'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm text-gray-900 tabular-nums">{a.quantity > 1 ? `${a.quantity} × ` : ''}{formatCurrency(a.value)}</div>
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activities.map((item) => (
                <li key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{item.action}</span>
                    {item.details && <span className="text-sm text-gray-600"> — {item.details}</span>}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {item.username ? `${item.username} · ` : ''}{formatDateTime(item.timestamp)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
