using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BtsAssetMgmt.Api.Extensions;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;

namespace BtsAssetMgmt.Api.Controllers
{
    [ApiController]
    [Route("api/v1/categories")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _categoryService.GetCategoriesAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Category category)
        {
            if (string.IsNullOrWhiteSpace(category.Name)) return BadRequest(new { message = "Category name is required." });
            try
            {
                var created = await _categoryService.CreateCategoryAsync(category, User.ToCurrentUser());
                return Created($"/api/v1/categories/{created.Id}", created);
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = $"A category named \"{category.Name.Trim()}\" already exists." });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Category category)
        {
            if (string.IsNullOrWhiteSpace(category.Name)) return BadRequest(new { message = "Category name is required." });
            try
            {
                var updated = await _categoryService.UpdateCategoryAsync(id, category, User.ToCurrentUser());
                if (updated == null) return NotFound(new { message = "Category not found." });
                return Ok(updated);
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = $"A category named \"{category.Name.Trim()}\" already exists." });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id, User.ToCurrentUser());
            if (result == null) return NotFound(new { message = "Category not found." });
            if (result == false) return Conflict(new { message = "This category still has assets. Move or delete those assets first." });
            return NoContent();
        }
    }
}
