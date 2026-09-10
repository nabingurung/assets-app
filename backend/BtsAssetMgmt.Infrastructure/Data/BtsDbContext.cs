using Microsoft.EntityFrameworkCore;
using BtsAssetMgmt.Core.Entities;

namespace BtsAssetMgmt.Infrastructure.Data
{
    public class BtsDbContext : DbContext
    {
        public BtsDbContext(DbContextOptions<BtsDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<Location> Locations { get; set; } = null!;
        public DbSet<Asset> Assets { get; set; } = null!;
        public DbSet<AssetHistory> AssetHistories { get; set; } = null!;
        public DbSet<AssetNote> AssetNotes { get; set; } = null!;
        public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<Category>().HasIndex(c => c.Name).IsUnique();
            modelBuilder.Entity<Location>().HasIndex(l => l.Name).IsUnique();
            modelBuilder.Entity<Asset>().HasIndex(a => a.Name);

            // Store enums as readable text in SQLite.
            modelBuilder.Entity<Asset>().Property(a => a.Status).HasConversion<string>();
            modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();

            // Prevent deleting a category/location that still has assets.
            modelBuilder.Entity<Asset>()
                .HasOne(a => a.Category)
                .WithMany(c => c.Assets)
                .HasForeignKey(a => a.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Asset>()
                .HasOne(a => a.Location)
                .WithMany(l => l.Assets)
                .HasForeignKey(a => a.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notes and history go away with the asset.
            modelBuilder.Entity<AssetHistory>()
                .HasOne(h => h.Asset)
                .WithMany(a => a.History)
                .HasForeignKey(h => h.AssetId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<AssetNote>()
                .HasOne(n => n.Asset)
                .WithMany(a => a.Notes)
                .HasForeignKey(n => n.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            // Audit rows keep UserId/Username as plain values (no FK) so history survives user changes.
            modelBuilder.Entity<ActivityLog>().HasIndex(l => l.Timestamp);

            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Furniture", Description = "Tables, chairs, cabinets" },
                new Category { Id = 2, Name = "Electronics", Description = "Computers, TVs, sound systems" },
                new Category { Id = 3, Name = "Sports Equipment", Description = "Balls, nets, jerseys" },
                new Category { Id = 4, Name = "Kitchen Equipment", Description = "Pots, pans, microwave" },
                new Category { Id = 5, Name = "Office Equipment", Description = "Printers, shredders" },
                new Category { Id = 6, Name = "Vehicles", Description = "Cars, vans" },
                new Category { Id = 7, Name = "Tools", Description = "Drills, saws, hammers" },
                new Category { Id = 8, Name = "Other", Description = "Miscellaneous assets" }
            );

            modelBuilder.Entity<Location>().HasData(
                new Location { Id = 1, Name = "Main Hall", Description = "Central area of the building" },
                new Location { Id = 2, Name = "Kitchen", Description = "Food preparation area" },
                new Location { Id = 3, Name = "Office", Description = "Administrative office" },
                new Location { Id = 4, Name = "Storage Room A", Description = "Primary storage for equipment" },
                new Location { Id = 5, Name = "Storage Room B", Description = "Secondary storage" }
            );
        }
    }
}
