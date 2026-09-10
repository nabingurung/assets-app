using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BtsAssetMgmt.Core.Entities
{
    public class AssetHistory
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

        public DateTime ChangeDate { get; set; } = DateTime.UtcNow;
        [Required]
        public string FieldChanged { get; set; } = string.Empty;
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }
}
