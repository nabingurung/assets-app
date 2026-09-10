using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Infrastructure.Services;

namespace BtsAssetMgmt.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly TestDbFactory _db = new();

    [Fact]
    public void HashPassword_ProducesVerifiableSaltedHash()
    {
        using var ctx = _db.CreateContext();
        var service = new AuthService(ctx, new JwtSettings { Secret = "unit-test-secret-key-that-is-long-enough-1234567890" });

        var hash1 = service.HashPassword("secret123");
        var hash2 = service.HashPassword("secret123");

        Assert.NotEqual(hash1, hash2); // random salt
        Assert.True(service.VerifyPassword("secret123", hash1));
        Assert.False(service.VerifyPassword("wrong", hash1));
        Assert.False(service.VerifyPassword("secret123", "hashed_password"));
    }

    [Fact]
    public void Login_ReturnsTokenAndUser_ForValidCredentials()
    {
        using var ctx = _db.CreateContext();
        var service = new AuthService(ctx, new JwtSettings { Secret = "unit-test-secret-key-that-is-long-enough-1234567890" });
        ctx.Users.Add(new User { Username = "admin", PasswordHash = service.HashPassword("admin123"), Role = UserRole.Admin });
        ctx.SaveChanges();

        var ok = service.Login(new LoginRequest("admin", "admin123"));
        var bad = service.Login(new LoginRequest("admin", "nope"));
        var missing = service.Login(new LoginRequest("ghost", "admin123"));

        Assert.NotNull(ok);
        Assert.False(string.IsNullOrEmpty(ok!.Token));
        Assert.Equal("admin", ok.User.Username);
        Assert.Equal("Admin", ok.User.Role);
        Assert.Null(bad);
        Assert.Null(missing);
    }

    public void Dispose() => _db.Dispose();
}
