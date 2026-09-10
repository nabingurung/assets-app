using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Infrastructure.Services;

namespace BtsAssetMgmt.Tests;

public class CategoryAndLocationServiceTests : IDisposable
{
    private readonly TestDbFactory _db = new();
    private static readonly CurrentUser User = TestDbFactory.TestUser;

    [Fact]
    public async Task Categories_AreSeeded_AndCanBeCreatedUpdatedDeleted()
    {
        using var ctx = _db.CreateContext();
        var service = new CategoryService(ctx, new ActivityLogService(ctx));

        var seeded = (await service.GetCategoriesAsync()).ToList();
        Assert.Equal(8, seeded.Count);

        var created = await service.CreateCategoryAsync(new Category { Name = "  Decorations " }, User);
        Assert.Equal("Decorations", created.Name);

        var updated = await service.UpdateCategoryAsync(created.Id, new Category { Name = "Decor", Description = "Festival items" }, User);
        Assert.Equal("Decor", updated!.Name);

        Assert.True(await service.DeleteCategoryAsync(created.Id, User));
        Assert.Null(await service.DeleteCategoryAsync(created.Id, User));
    }

    [Fact]
    public async Task DeletingCategoryInUse_IsRefused()
    {
        using var ctx = _db.CreateContext();
        var log = new ActivityLogService(ctx);
        var assets = new AssetService(ctx, log);
        var categories = new CategoryService(ctx, log);

        await assets.CreateAssetAsync(new Asset { Name = "Sofa", CategoryId = 1, LocationId = 1 }, User);

        Assert.False(await categories.DeleteCategoryAsync(1, User));
        Assert.NotNull(await ctx.Categories.FindAsync(1));
    }

    [Fact]
    public async Task DeletingLocationInUse_IsRefused_ButUnusedIsDeleted()
    {
        using var ctx = _db.CreateContext();
        var log = new ActivityLogService(ctx);
        var assets = new AssetService(ctx, log);
        var locations = new LocationService(ctx, log);

        await assets.CreateAssetAsync(new Asset { Name = "Fridge", CategoryId = 4, LocationId = 2 }, User);

        Assert.False(await locations.DeleteLocationAsync(2, User));
        Assert.True(await locations.DeleteLocationAsync(5, User));
        Assert.Equal(4, (await locations.GetLocationsAsync()).Count());
    }

    public void Dispose() => _db.Dispose();
}
