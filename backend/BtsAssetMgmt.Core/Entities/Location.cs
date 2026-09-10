using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BtsAssetMgmt.Core.Entities
{
    public class Location
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        [JsonIgnore]
        public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
    }
}
