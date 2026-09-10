using System;
using System.Collections.Generic;
using BtsAssetMgmt.Core.Entities;

namespace BtsAssetMgmt.Core.Dtos
{
    public record NamedCount(string Name, int Count, decimal Value);

    public record DashboardSummary(
        int TotalAssets,
        int TotalQuantity,
        int ActiveAssets,
        int InactiveAssets,
        int MaintenanceAssets,
        int RetiredAssets,
        int LostAssets,
        decimal TotalValue,
        int TotalCategories,
        int TotalLocations,
        int AddedLast30Days,
        IReadOnlyList<NamedCount> CategoryDistribution,
        IReadOnlyList<NamedCount> LocationDistribution,
        IReadOnlyList<Asset> RecentAssets);

    public record ActivityItem(int Id, string Action, string? Details, string? Username, DateTime Timestamp);
}
