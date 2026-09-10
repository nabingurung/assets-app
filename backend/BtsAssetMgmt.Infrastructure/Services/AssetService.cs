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
    public class AssetService : IAssetService
    {
        private readonly BtsDbContext _context;
        private readonly IActivityLogService _activityLog;

        public AssetService(BtsDbContext context, IActivityLogService activityLog)
        {
            _context = context;
            _activityLog = activityLog;
        }

        public async Task<IEnumerable<Asset>> GetAssetsAsync(AssetFilter filter)
        {
            var query = _context.Assets
                .AsNoTracking()
                .Include(a => a.Category)
                .Include(a => a.Location)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(a =>
                    a.Name.ToLower().Contains(term) ||
                    (a.SKU != null && a.SKU.ToLower().Contains(term)) ||
                    (a.SerialNumber != null && a.SerialNumber.ToLower().Contains(term)) ||
                    (a.Description != null && a.Description.ToLower().Contains(term)));
            }

            if (filter.CategoryId.HasValue)
                query = query.Where(a => a.CategoryId == filter.CategoryId.Value);

            if (filter.LocationId.HasValue)
                query = query.Where(a => a.LocationId == filter.LocationId.Value);

            if (filter.Status.HasValue)
                query = query.Where(a => a.Status == filter.Status.Value);

            return await query.OrderBy(a => a.Name).ToListAsync();
        }

        public async Task<Asset?> GetAssetByIdAsync(Guid id)
        {
            return await _context.Assets
                .AsNoTracking()
                .Include(a => a.Category)
                .Include(a => a.Location)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Asset> CreateAssetAsync(Asset asset, CurrentUser user)
        {
            asset.Id = Guid.NewGuid();
            asset.Category = null;
            asset.Location = null;
            asset.CreatedAt = DateTime.UtcNow;
            asset.UpdatedAt = asset.CreatedAt;

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Asset Created", $"Created asset \"{asset.Name}\"");

            return (await GetAssetByIdAsync(asset.Id))!;
        }

        public async Task<Asset?> UpdateAssetAsync(Guid id, Asset updated, CurrentUser user)
        {
            var existing = await _context.Assets.FirstOrDefaultAsync(a => a.Id == id);
            if (existing == null) return null;

            var changes = await TrackChangesAsync(existing, updated, user);

            existing.Name = updated.Name;
            existing.SKU = updated.SKU;
            existing.SerialNumber = updated.SerialNumber;
            existing.CategoryId = updated.CategoryId;
            existing.LocationId = updated.LocationId;
            existing.PurchaseDate = updated.PurchaseDate;
            existing.Quantity = updated.Quantity;
            existing.Value = updated.Value;
            existing.Status = updated.Status;
            existing.Description = updated.Description;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var summary = changes.Count == 0
                ? $"Saved asset \"{existing.Name}\" (no field changes)"
                : $"Updated asset \"{existing.Name}\": {string.Join(", ", changes.Select(c => c.FieldChanged))}";
            await _activityLog.LogActivityAsync(user, "Asset Updated", summary);

            return await GetAssetByIdAsync(id);
        }

        public async Task<bool> DeleteAssetAsync(Guid id, CurrentUser user)
        {
            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == id);
            if (asset == null) return false;

            _context.Assets.Remove(asset);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Asset Deleted", $"Deleted asset \"{asset.Name}\"");
            return true;
        }

        public async Task<IEnumerable<AssetHistory>> GetAssetHistoryAsync(Guid assetId)
        {
            return await _context.AssetHistories
                .AsNoTracking()
                .Where(h => h.AssetId == assetId)
                .OrderByDescending(h => h.ChangeDate)
                .ThenByDescending(h => h.Id)
                .ToListAsync();
        }

        public async Task<IEnumerable<AssetNote>> GetAssetNotesAsync(Guid assetId)
        {
            return await _context.AssetNotes
                .AsNoTracking()
                .Where(n => n.AssetId == assetId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task<AssetNote?> AddNoteAsync(Guid assetId, CurrentUser user, string content)
        {
            var asset = await _context.Assets.AsNoTracking().FirstOrDefaultAsync(a => a.Id == assetId);
            if (asset == null) return null;

            var note = new AssetNote
            {
                AssetId = assetId,
                UserId = user.Id,
                Username = user.Username,
                Content = content.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.AssetNotes.Add(note);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Note Added", $"Added a note to \"{asset.Name}\"");
            return note;
        }

        private async Task<List<AssetHistory>> TrackChangesAsync(Asset oldAsset, Asset newAsset, CurrentUser user)
        {
            var history = new List<AssetHistory>();

            void Track(string field, string? oldValue, string? newValue)
            {
                if ((oldValue ?? string.Empty) == (newValue ?? string.Empty)) return;
                history.Add(new AssetHistory
                {
                    AssetId = oldAsset.Id,
                    UserId = user.Id,
                    Username = user.Username,
                    FieldChanged = field,
                    OldValue = oldValue,
                    NewValue = newValue
                });
            }

            Track("Name", oldAsset.Name, newAsset.Name);
            Track("SKU", oldAsset.SKU, newAsset.SKU);
            Track("Serial Number", oldAsset.SerialNumber, newAsset.SerialNumber);
            Track("Purchase Date", oldAsset.PurchaseDate?.ToString("yyyy-MM-dd"), newAsset.PurchaseDate?.ToString("yyyy-MM-dd"));
            Track("Quantity", oldAsset.Quantity.ToString(), newAsset.Quantity.ToString());
            Track("Value", oldAsset.Value.ToString("0.##"), newAsset.Value.ToString("0.##"));
            Track("Status", oldAsset.Status.ToString(), newAsset.Status.ToString());
            Track("Description", oldAsset.Description, newAsset.Description);

            if (oldAsset.CategoryId != newAsset.CategoryId)
            {
                var names = await _context.Categories.AsNoTracking()
                    .Where(c => c.Id == oldAsset.CategoryId || c.Id == newAsset.CategoryId)
                    .ToDictionaryAsync(c => c.Id, c => c.Name);
                Track("Category", names.GetValueOrDefault(oldAsset.CategoryId, oldAsset.CategoryId.ToString()),
                                  names.GetValueOrDefault(newAsset.CategoryId, newAsset.CategoryId.ToString()));
            }

            if (oldAsset.LocationId != newAsset.LocationId)
            {
                var names = await _context.Locations.AsNoTracking()
                    .Where(l => l.Id == oldAsset.LocationId || l.Id == newAsset.LocationId)
                    .ToDictionaryAsync(l => l.Id, l => l.Name);
                Track("Location", names.GetValueOrDefault(oldAsset.LocationId, oldAsset.LocationId.ToString()),
                                  names.GetValueOrDefault(newAsset.LocationId, newAsset.LocationId.ToString()));
            }

            _context.AssetHistories.AddRange(history);
            return history;
        }
    }
}
