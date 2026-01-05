namespace LezzetAtlasi.Models;

/// <summary>
/// Kullanıcı bilgilerini temsil eden DTO
/// </summary>
public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = string.Empty;
    public bool IsGourmet { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public UserPreferencesDto? Preferences { get; set; }
}

/// <summary>
/// Kullanıcı tercihlerini temsil eden DTO
/// </summary>
public class UserPreferencesDto
{
    public List<string> FavoriteCuisines { get; set; } = new();
    public List<string> DietaryRestrictions { get; set; } = new();
    public string PreferredLanguage { get; set; } = "tr";
    public bool NotificationsEnabled { get; set; } = true;
    public bool LocationEnabled { get; set; } = true;
}

/// <summary>
/// Kayıt işlemi için kullanılan DTO
/// </summary>
public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

/// <summary>
/// Giriş işlemi için kullanılan DTO
/// </summary>
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
}

/// <summary>
/// Kimlik doğrulama yanıtı DTO
/// </summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}
