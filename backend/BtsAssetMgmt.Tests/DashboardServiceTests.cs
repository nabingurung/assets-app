using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Infrastructure.Services;

namespace BtsAssetMgmt.Tests;

public class DashboardServiceTests : IDisposable
{
    private readonly TestDbFactory _db = new();

    [Fact]
    public async Task Summary_AggregatesCountsValuesAndDistributions()
    {
        using var ctx = _db.CreateContext();
        var log = new ActivityLogService(ctx);
        var assets = new AssetService(ctx, log);
        var user = TestDbFactory.TestUser;

        await assets.CreateAssetAsync(new Asset { Name = "TV", CategoryId = 2, LocationId = 1, Value = 500m, Quantity = 2 }, user);
        await assets.CreateAssetAsync(new Asset { Name = "Speaker", CategoryId = 2, LocationId = 1, Value = 200m, Status = AssetStatus.Maintenance }, user);
        await assets.CreateAssetAsync(new Asset { Name = "Table", CategoryId = 1, LocationId = 2, Value = 150m, Status = AssetStatus.Retired }, user);

        var summary = await new DashboardService(ctx).GetSummaryAsync();

        Assert.Equal(3, summary.TotalAssets);
        Assert.Equal(1, summary.ActiveAssets);
        Assert.Equal(1, summary.MaintenanceAssets);
        Assert.Equal(1, summary.RetiredAssets);
        Assert.Equal(4, summary.TotalQuantity);
        Assert.Equal(1350m, summary.TotalValue); // 2 x 500 + 200 + 150
        Assert.Equal(3, summary.AddedLast30Days);
        Assert.Equal(8, summary.TotalCategories);
        Assert.Equal(5, summary.TotalLocations);

        var electronics = summary.CategoryDistribution.First();
        Assert.Equal("Electronics", electronics.Name);
        Assert.Equal(2, electronics.Count);
        Assert.Equal(1200m, electronics.Value);

        Assert.Equal("Main Hall", summary.LocationDistribution.First().Name);
        Assert.Equal(3, summary.RecentAssets.Count);

        var activity = (await new DashboardService(ctx).GetRecentActivityAsync()).ToList();
        Assert.Equal(3, activity.Count);
        Assert.All(activity, a => Assert.Equal("Asset Created", a.Action));
    }

    public void Dispose() => _db.Dispose();
}
