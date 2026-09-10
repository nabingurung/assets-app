using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace BtsAssetMgmt.Tests;

/// <summary>
/// Creates a throwaway in-memory SQLite database per test. The connection must stay open
/// for the database to keep existing, so callers dispose this factory when done.
/// </summary>
public sealed class TestDbFactory : IDisposable
{
    private readonly SqliteConnection _connection;

    public static readonly CurrentUser TestUser = new(Guid.NewGuid(), "tester");

    public TestDbFactory()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        using var ctx = CreateContext();
        ctx.Database.EnsureCreated();
    }

    public BtsDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BtsDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new BtsDbContext(options);
    }

    public void Dispose() => _connection.Dispose();
}
