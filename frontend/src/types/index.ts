export type UserRole = 'Admin' | 'User';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface Location {
  id: number;
  name: string;
  description?: string | null;
}

export const ASSET_STATUSES = ['Active', 'Inactive', 'Maintenance', 'Retired', 'Lost'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export interface Asset {
  id: string;
  name: string;
  sku?: string | null;
  serialNumber?: string | null;
  categoryId: number;
  locationId: number;
  purchaseDate?: string | null;
  quantity: number;
  /** Value per unit. */
  value: number;
  status: AssetStatus;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  location?: Location | null;
}

/** Shape sent to POST/PUT /assets. */
export interface AssetInput {
  name: string;
  sku: string;
  serialNumber: string;
  categoryId: number;
  locationId: number;
  purchaseDate: string | null;
  quantity: number;
  value: number;
  status: AssetStatus;
  description: string;
}

export interface AssetHistory {
  id: number;
  assetId: string;
  userId?: string | null;
  username?: string | null;
  changeDate: string;
  fieldChanged: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export interface AssetNote {
  id: number;
  assetId: string;
  userId?: string | null;
  username?: string | null;
  content: string;
  createdAt: string;
}

export interface NamedCount {
  name: string;
  count: number;
  value: number;
}

export interface DashboardSummary {
  totalAssets: number;
  totalQuantity: number;
  activeAssets: number;
  inactiveAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  lostAssets: number;
  totalValue: number;
  totalCategories: number;
  totalLocations: number;
  addedLast30Days: number;
  categoryDistribution: NamedCount[];
  locationDistribution: NamedCount[];
  recentAssets: Asset[];
}

export interface ActivityItem {
  id: number;
  action: string;
  details?: string | null;
  username?: string | null;
  timestamp: string;
}

export interface BackupInfo {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}
