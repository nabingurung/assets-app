using System.Collections.Generic;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;

namespace BtsAssetMgmt.Core.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<Category>> GetCategoriesAsync();
        Task<Category> CreateCategoryAsync(Category category, CurrentUser user);
        Task<Category?> UpdateCategoryAsync(int id, Category category, CurrentUser user);
        /// <summary>Returns null if not found, false if the category is still in use.</summary>
        Task<bool?> DeleteCategoryAsync(int id, CurrentUser user);
    }
}
