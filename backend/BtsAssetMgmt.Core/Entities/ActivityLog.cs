using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BtsAssetMgmt.Core.Entities
{
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }

        public Guid? UserId { get; set; }
        public string? Username { get; set; }

        [Required]
        public string Action { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? Details { get; set; }
    }
}
