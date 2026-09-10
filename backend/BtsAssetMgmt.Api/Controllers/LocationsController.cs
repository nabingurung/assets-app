using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BtsAssetMgmt.Api.Extensions;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;

namespace BtsAssetMgmt.Api.Controllers
{
    [ApiController]
    [Route("api/v1/locations")]
    [Authorize]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationsController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _locationService.GetLocationsAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Location location)
        {
            if (string.IsNullOrWhiteSpace(location.Name)) return BadRequest(new { message = "Location name is required." });
            try
            {
                var created = await _locationService.CreateLocationAsync(location, User.ToCurrentUser());
                return Created($"/api/v1/locations/{created.Id}", created);
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = $"A location named \"{location.Name.Trim()}\" already exists." });
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Location location)
        {
            if (string.IsNullOrWhiteSpace(location.Name)) return BadRequest(new { message = "Location name is required." });
            try
            {
                var updated = await _locationService.UpdateLocationAsync(id, location, User.ToCurrentUser());
                if (updated == null) return NotFound(new { message = "Location not found." });
                return Ok(updated);
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = $"A location named \"{location.Name.Trim()}\" already exists." });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _locationService.DeleteLocationAsync(id, User.ToCurrentUser());
            if (result == null) return NotFound(new { message = "Location not found." });
            if (result == false) return Conflict(new { message = "This location still has assets. Move or delete those assets first." });
            return NoContent();
        }
    }
}
