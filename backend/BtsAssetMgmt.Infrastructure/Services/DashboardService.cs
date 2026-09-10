using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;
using BtsAssetMgmt.Infrastructure.Data;

namespace BtsAssetMgmt.Infrastructure.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly BtsDbContext _context;

        public DashboardService(BtsDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardSummary> GetSummaryAsync()
        {
            var assets = await _context.Assets.AsNoTracking()
                .Include(a => a.Category)
                .Include(a => a.Location)
                .ToListAsync();

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            var byCategory = assets
                .GroupBy(a => a.Category?.Name ?? "Uncategorized")
                .Select(g => new NamedCount(g.Key, g.Count(), g.Sum(a => a.Value * a.Quantity)))
                .OrderByDescending(x => x.Count).ThenBy(x => x.Name)
                .ToList();

            var byLocation = assets
                .GroupBy(a => a.Location?.Name ?? "Unknown")
                .Select(g => new NamedCount(g.Key, g.Count(), g.Sum(a => a.Value * a.Quantity)))
                .OrderByDescending(x => x.Count).ThenBy(x => x.Name)
                .ToList();

            var recent = assets
                .OrderByDescending(a => a.CreatedAt)
                .Take(5)
                .ToList();

            return new DashboardSummary(
                TotalAssets: assets.Count,
                TotalQuantity: assets.Sum(a => a.Quantity),
                ActiveAssets: assets.Count(a => a.Status == AssetStatus.Active),
                InactiveAssets: assets.Count(a => a.Status == AssetStatus.Inactive),
                MaintenanceAssets: assets.Count(a => a.Status == AssetStatus.Maintenance),
                RetiredAssets: assets.Count(a => a.Status == AssetStatus.Retired),
                LostAssets: assets.Count(a => a.Status == AssetStatus.Lost),
                TotalValue: assets.Sum(a => a.Value * a.Quantity),
                TotalCategories: await _context.Categories.CountAsync(),
                TotalLocations: await _context.Locations.CountAsync(),
                AddedLast30Days: assets.Count(a => a.CreatedAt >= thirtyDaysAgo),
                CategoryDistribution: byCategory,
                LocationDistribution: byLocation,
                RecentAssets: recent);
        }

        public async Task<IEnumerable<ActivityItem>> GetRecentActivityAsync(int take = 20)
        {
            return await _context.ActivityLogs.AsNoTracking()
                .OrderByDescending(l => l.Timestamp)
                .ThenByDescending(l => l.Id)
                .Take(take)
                .Select(l => new ActivityItem(l.Id, l.Action, l.Details, l.Username, l.Timestamp))
                .ToListAsync();
        }
    }
}
