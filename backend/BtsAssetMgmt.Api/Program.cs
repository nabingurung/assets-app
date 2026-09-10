using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BtsAssetMgmt.Core.Interfaces;
using BtsAssetMgmt.Infrastructure.Data;
using BtsAssetMgmt.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Configuration -------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=/app/data/bts.db";

var dataSource = new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(connectionString).DataSource;
var dataDir = Path.GetDirectoryName(Path.GetFullPath(dataSource)) ?? ".";
Directory.CreateDirectory(dataDir);

// JWT signing key: use Jwt:Secret if configured (32+ chars), otherwise generate a random key once
// per installation and keep it next to the database so logins survive restarts.
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
if (string.IsNullOrWhiteSpace(jwtSettings.Secret) || jwtSettings.Secret.Length < 32)
{
    jwtSettings.Secret = JwtSettings.LoadOrCreateSecret(Path.Combine(dataDir, "jwt.key"));
}

// ---- Services -------------------------------------------------------------
builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

builder.Services.AddDbContext<BtsDbContext>(options => options.UseSqlite(connectionString));

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// ---- Database -------------------------------------------------------------
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<BtsDbContext>();
    var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
    await DbInitializer.InitializeAsync(dbContext, authService, app.Configuration["Admin:DefaultPassword"]);
}

// ---- Pipeline -------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// The app runs on a local network over plain HTTP; only redirect when HTTPS is actually configured.
if (!string.IsNullOrEmpty(app.Configuration["ASPNETCORE_HTTPS_PORTS"]) || !string.IsNullOrEmpty(app.Configuration["HTTPS_PORT"]))
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Unknown API routes get a JSON 404; everything else falls back to the React app so
// client-side routes keep working after a page refresh.
app.Map("/api/{**rest}", () => Results.NotFound(new { message = "API endpoint not found." }));
app.MapFallbackToFile("index.html");

app.Run();

public partial class Program { }
