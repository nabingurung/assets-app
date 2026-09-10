using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;
using BtsAssetMgmt.Infrastructure.Data;
using Microsoft.IdentityModel.Tokens;

namespace BtsAssetMgmt.Infrastructure.Services
{
    public class JwtSettings
    {
        public const string SectionName = "Jwt";
        public string Secret { get; set; } = string.Empty;
        public int ExpiryDays { get; set; } = 7;

        /// <summary>Reads the signing key from <paramref name="path"/>, creating a random 64-byte key on first use.</summary>
        public static string LoadOrCreateSecret(string path)
        {
            if (File.Exists(path))
            {
                var existing = File.ReadAllText(path).Trim();
                if (existing.Length >= 32) return existing;
            }

            var secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            File.WriteAllText(path, secret);
            return secret;
        }
    }

    public class AuthService : IAuthService
    {
        private const int Pbkdf2Iterations = 100_000;
        private const int SaltSize = 16;
        private const int KeySize = 32;

        private readonly BtsDbContext _context;
        private readonly JwtSettings _jwt;

        public AuthService(BtsDbContext context, JwtSettings jwt)
        {
            _context = context;
            _jwt = jwt;
        }

        public LoginResponse? Login(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return null;
            }

            var user = _context.Users.FirstOrDefault(u => u.Username == request.Username);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return null;
            }

            var token = GenerateJwtToken(user);
            return new LoginResponse(token, new UserDto(user.Id, user.Username, user.Role.ToString()));
        }

        public string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwt.Secret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role.ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(_jwt.ExpiryDays),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>Hash format: PBKDF2$iterations$base64(salt)$base64(hash)</summary>
        public string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Pbkdf2Iterations, HashAlgorithmName.SHA256, KeySize);
            return $"PBKDF2${Pbkdf2Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public bool VerifyPassword(string password, string storedHash)
        {
            if (string.IsNullOrEmpty(storedHash)) return false;

            var parts = storedHash.Split('$');
            if (parts.Length != 4 || parts[0] != "PBKDF2") return false;

            if (!int.TryParse(parts[1], out var iterations)) return false;
            var salt = Convert.FromBase64String(parts[2]);
            var expected = Convert.FromBase64String(parts[3]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
    }
}
