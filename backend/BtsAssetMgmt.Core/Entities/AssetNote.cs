using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BtsAssetMgmt.Core.Entities
{
    public class AssetNote
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid AssetId { get; set; }
        [ForeignKey("AssetId")]
        [JsonIgnore]
        public virtual Asset? Asset { get; set; }

        public Guid? UserId { get; set; }
        public string? Username { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
