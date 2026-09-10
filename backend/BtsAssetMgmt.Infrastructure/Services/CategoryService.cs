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
    public class CategoryService : ICategoryService
    {
        private readonly BtsDbContext _context;
        private readonly IActivityLogService _activityLog;

        public CategoryService(BtsDbContext context, IActivityLogService activityLog)
        {
            _context = context;
            _activityLog = activityLog;
        }

        public async Task<IEnumerable<Category>> GetCategoriesAsync()
        {
            return await _context.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync();
        }

        public async Task<Category> CreateCategoryAsync(Category category, CurrentUser user)
        {
            category.Id = 0;
            category.Name = category.Name.Trim();
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Category Created", $"Created category \"{category.Name}\"");
            return category;
        }

        public async Task<Category?> UpdateCategoryAsync(int id, Category category, CurrentUser user)
        {
            var existing = await _context.Categories.FindAsync(id);
            if (existing == null) return null;

            var oldName = existing.Name;
            existing.Name = category.Name.Trim();
            existing.Description = category.Description;

            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Category Updated",
                oldName == existing.Name ? $"Updated category \"{existing.Name}\"" : $"Renamed category \"{oldName}\" to \"{existing.Name}\"");
            return existing;
        }

        public async Task<bool?> DeleteCategoryAsync(int id, CurrentUser user)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return null;

            if (await _context.Assets.AnyAsync(a => a.CategoryId == id)) return false;

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Category Deleted", $"Deleted category \"{category.Name}\"");
            return true;
        }
    }
}
