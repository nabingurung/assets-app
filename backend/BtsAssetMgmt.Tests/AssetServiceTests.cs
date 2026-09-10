using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace BtsAssetMgmt.Tests;

public class AssetServiceTests : IDisposable
{
    private readonly TestDbFactory _db = new();
    private static readonly CurrentUser User = TestDbFactory.TestUser;

    private AssetService CreateService(Infrastructure.Data.BtsDbContext ctx) => new(ctx, new ActivityLogService(ctx));

    private static Asset NewAsset(string name, int categoryId = 1, int locationId = 1, AssetStatus status = AssetStatus.Active) => new()
    {
        Name = name,
        SKU = $"SKU-{name}",
        SerialNumber = $"SN-{name}",
        CategoryId = categoryId,
        LocationId = locationId,
        Value = 100m,
        Status = status
    };

    [Fact]
    public async Task Create_PersistsAsset_IncludesNavigation_AndLogsActivity()
    {
        using var ctx = _db.CreateContext();
        var service = CreateService(ctx);

        var created = await service.CreateAssetAsync(NewAsset("Projector", categoryId: 2, locationId: 3), User);

        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Electronics", created.Category?.Name);
        Assert.Equal("Office", created.Location?.Name);

        var log = await ctx.ActivityLogs.SingleAsync();
        Assert.Equal("Asset Created", log.Action);
        Assert.Equal("tester", log.Username);
    }

    [Fact]
    public async Task Update_RecordsHistory_WithReadableCategoryNames()
    {
        using var ctx = _db.CreateContext();
        var service = CreateService(ctx);
        var created = await service.CreateAssetAsync(NewAsset("Chair"), User);

        var changes = NewAsset("Folding Chair", categoryId: 4, locationId: 1, status: AssetStatus.Maintenance);
        changes.Value = 250m;
        changes.Quantity = 6;
        var updated = await service.UpdateAssetAsync(created.Id, changes, User);

        Assert.NotNull(updated);
        Assert.Equal("Folding Chair", updated!.Name);

        var history = (await service.GetAssetHistoryAsync(created.Id)).ToList();
        var fields = history.Select(h => h.FieldChanged).ToHashSet();
        Assert.Contains("Name", fields);
        Assert.Contains("Category", fields);
        Assert.Contains("Status", fields);
        Assert.Contains("Value", fields);
        Assert.Contains("Quantity", fields);
        Assert.Equal("6", history.Single(h => h.FieldChanged == "Quantity").NewValue);
        Assert.DoesNotContain("Location", fields);

        var categoryChange = history.Single(h => h.FieldChanged == "Category");
        Assert.Equal("Furniture", categoryChange.OldValue);
        Assert.Equal("Kitchen Equipment", categoryChange.NewValue);
    }

    [Fact]
    public async Task GetAssets_FiltersBySearchCategoryLocationAndStatus()
    {
        using var ctx = _db.CreateContext();
        var service = CreateService(ctx);
        await service.CreateAssetAsync(NewAsset("Laptop", categoryId: 2, locationId: 3), User);
        await service.CreateAssetAsync(NewAsset("Table", categoryId: 1, locationId: 1), User);
        await service.CreateAssetAsync(NewAsset("Old Laptop", categoryId: 2, locationId: 4, status: AssetStatus.Retired), User);

        Assert.Equal(2, (await service.GetAssetsAsync(new AssetFilter("laptop", null, null, null))).Count());
        Assert.Equal(2, (await service.GetAssetsAsync(new AssetFilter(null, 2, null, null))).Count());
        Assert.Single(await service.GetAssetsAsync(new AssetFilter(null, null, 1, null)));
        Assert.Single(await service.GetAssetsAsync(new AssetFilter(null, null, null, AssetStatus.Retired)));
        Assert.Single(await service.GetAssetsAsync(new AssetFilter("laptop", 2, null, AssetStatus.Active)));
    }

    [Fact]
    public async Task Delete_RemovesAssetAndItsNotes()
    {
        using var ctx = _db.CreateContext();
        var service = CreateService(ctx);
        var created = await service.CreateAssetAsync(NewAsset("Drill", categoryId: 7), User);
        await service.AddNoteAsync(created.Id, User, "Needs new battery");

        Assert.True(await service.DeleteAssetAsync(created.Id, User));
        Assert.Null(await service.GetAssetByIdAsync(created.Id));
        Assert.Empty(await service.GetAssetNotesAsync(created.Id));
        Assert.False(await service.DeleteAssetAsync(created.Id, User));
    }

    [Fact]
    public async Task AddNote_ReturnsNull_ForUnknownAsset()
    {
        using var ctx = _db.CreateContext();
        var service = CreateService(ctx);
        Assert.Null(await service.AddNoteAsync(Guid.NewGuid(), User, "hello"));
    }

    public void Dispose() => _db.Dispose();
}
