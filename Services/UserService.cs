namespace LezzetAtlasi.Services;

/// <summary>
/// Kullanıcı servisi arayüzü
/// </summary>
public interface IUserService
{
    Task<UserDto?> GetUserProfileAsync(string userId);
    Task<UserDto?> GetCurrentUserProfileAsync();
    Task<bool> UpdateUserProfileAsync(UserDto userDto);
    Task<bool> UpdateUserPreferencesAsync(UserPreferencesDto preferences);
    Task<bool> UploadProfileImageAsync(string imageUrl);
}

/// <summary>
/// Kullanıcı servisi implementasyonu (Mock)
/// </summary>
public class UserService : IUserService
{
    private UserDto? _currentUser;

    public UserService()
    {
        // Initialize with mock current user
        _currentUser = new UserDto
        {
            Id = "current-user-id",
            Email = "user@example.com",
            FirstName = "Kullanıcı",
            LastName = "Test",
            IsGourmet = false,
            CreatedAt = DateTime.Now.AddMonths(-3),
            Preferences = new UserPreferencesDto
            {
                FavoriteCuisines = new List<string> { "Türk", "İtalyan" },
                PreferredLanguage = "tr",
                NotificationsEnabled = true,
                LocationEnabled = true
            }
        };
    }

    public Task<UserDto?> GetUserProfileAsync(string userId)
    {
        if (_currentUser?.Id == userId)
            return Task.FromResult(_currentUser);

        // Return mock user for other IDs
        var mockUser = new UserDto
        {
            Id = userId,
            Email = "mock@example.com",
            FirstName = "Mock",
            LastName = "User",
            IsGourmet = false,
            CreatedAt = DateTime.Now.AddMonths(-6)
        };

        return Task.FromResult<UserDto?>(mockUser);
    }

    public Task<UserDto?> GetCurrentUserProfileAsync()
    {
        return Task.FromResult(_currentUser);
    }

    public Task<bool> UpdateUserProfileAsync(UserDto userDto)
    {
        if (_currentUser != null)
        {
            _currentUser.FirstName = userDto.FirstName;
            _currentUser.LastName = userDto.LastName;
            _currentUser.PhoneNumber = userDto.PhoneNumber;
            _currentUser.ProfileImageUrl = userDto.ProfileImageUrl;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> UpdateUserPreferencesAsync(UserPreferencesDto preferences)
    {
        if (_currentUser != null)
        {
            _currentUser.Preferences = preferences;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> UploadProfileImageAsync(string imageUrl)
    {
        if (_currentUser != null)
        {
            _currentUser.ProfileImageUrl = imageUrl;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
}
