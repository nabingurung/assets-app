using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BtsAssetMgmt.Api.Extensions;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;

namespace BtsAssetMgmt.Api.Controllers
{
    [ApiController]
    [Route("api/v1/assets")]
    [Authorize]
    public class AssetsController : ControllerBase
    {
        private readonly IAssetService _assetService;

        public AssetsController(IAssetService assetService)
        {
            _assetService = assetService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAssets([FromQuery] string? search, [FromQuery] int? categoryId, [FromQuery] int? locationId, [FromQuery] AssetStatus? status)
        {
            var assets = await _assetService.GetAssetsAsync(new AssetFilter(search, categoryId, locationId, status));
            return Ok(assets);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetAsset(Guid id)
        {
            var asset = await _assetService.GetAssetByIdAsync(id);
            if (asset == null) return NotFound(new { message = "Asset not found." });
            return Ok(asset);
        }

        private static string? Validate(Asset asset)
        {
            if (string.IsNullOrWhiteSpace(asset.Name)) return "Asset name is required.";
            if (asset.Quantity < 1) return "Quantity is required and must be greater than 0.";
            if (asset.Value < 0) return "Value cannot be negative.";
            return null;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsset([FromBody] Asset asset)
        {
            if (Validate(asset) is string createError) return BadRequest(new { message = createError });
            var created = await _assetService.CreateAssetAsync(asset, User.ToCurrentUser());
            return CreatedAtAction(nameof(GetAsset), new { id = created.Id }, created);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] Asset asset)
        {
            if (Validate(asset) is string updateError) return BadRequest(new { message = updateError });
            var updated = await _assetService.UpdateAssetAsync(id, asset, User.ToCurrentUser());
            if (updated == null) return NotFound(new { message = "Asset not found." });
            return Ok(updated);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteAsset(Guid id)
        {
            var success = await _assetService.DeleteAssetAsync(id, User.ToCurrentUser());
            if (!success) return NotFound(new { message = "Asset not found." });
            return NoContent();
        }

        [HttpGet("{id:guid}/history")]
        public async Task<IActionResult> GetHistory(Guid id)
        {
            return Ok(await _assetService.GetAssetHistoryAsync(id));
        }

        [HttpGet("{id:guid}/notes")]
        public async Task<IActionResult> GetNotes(Guid id)
        {
            return Ok(await _assetService.GetAssetNotesAsync(id));
        }

        [HttpPost("{id:guid}/notes")]
        public async Task<IActionResult> AddNote(Guid id, [FromBody] AddNoteRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest(new { message = "Note content is required." });
            var note = await _assetService.AddNoteAsync(id, User.ToCurrentUser(), request.Content);
            if (note == null) return NotFound(new { message = "Asset not found." });
            return Ok(note);
        }
    }
}
