using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BtsAssetMgmt.Core.Entities
{
    public enum UserRole
    {
        Admin,
        User
    }

    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        [Required]
        public UserRole Role { get; set; } = UserRole.User;
    }
}
