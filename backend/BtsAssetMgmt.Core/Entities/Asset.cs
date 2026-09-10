using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BtsAssetMgmt.Core.Entities
{
    public enum AssetStatus
    {
        Active,
        Inactive,
        Maintenance,
        Retired,
        Lost
    }

    public class Asset
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? SKU { get; set; }
        public string? SerialNumber { get; set; }

        [Required]
        public int CategoryId { get; set; }
        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        [Required]
        public int LocationId { get; set; }
        [ForeignKey("LocationId")]
        public virtual Location? Location { get; set; }

        public DateTime? PurchaseDate { get; set; }
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; } = 1;
        /// <summary>Value per unit.</summary>
        public decimal Value { get; set; }
        public AssetStatus Status { get; set; } = AssetStatus.Active;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public virtual ICollection<AssetHistory> History { get; set; } = new List<AssetHistory>();
        [JsonIgnore]
        public virtual ICollection<AssetNote> Notes { get; set; } = new List<AssetNote>();
    }
}
