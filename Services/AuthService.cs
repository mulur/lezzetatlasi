namespace LezzetAtlasi.Services;

/// <summary>
/// Kimlik doğrulama servisi arayüzü
/// </summary>
public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task LogoutAsync();
    Task<bool> IsAuthenticatedAsync();
    Task<UserDto?> GetCurrentUserAsync();
    Task<bool> RefreshTokenAsync();
}

/// <summary>
/// Kimlik doğrulama servisi implementasyonu (Mock)
/// </summary>
public class AuthService : IAuthService
{
    private UserDto? _currentUser;
    private string? _token;

    public Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        // Mock implementation
        _currentUser = new UserDto
        {
            Id = Guid.NewGuid().ToString(),
            Email = loginDto.Email,
            FirstName = "Test",
            LastName = "User",
            IsGourmet = false,
            CreatedAt = DateTime.Now,
            LastLoginAt = DateTime.Now
        };

        _token = Guid.NewGuid().ToString();

        var response = new AuthResponseDto
        {
            Token = _token,
            RefreshToken = Guid.NewGuid().ToString(),
            User = _currentUser,
            ExpiresAt = DateTime.Now.AddDays(7)
        };

        return Task.FromResult(response);
    }

    public Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        // Mock implementation
        _currentUser = new UserDto
        {
            Id = Guid.NewGuid().ToString(),
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            PhoneNumber = registerDto.PhoneNumber,
            IsGourmet = false,
            CreatedAt = DateTime.Now
        };

        _token = Guid.NewGuid().ToString();

        var response = new AuthResponseDto
        {
            Token = _token,
            RefreshToken = Guid.NewGuid().ToString(),
            User = _currentUser,
            ExpiresAt = DateTime.Now.AddDays(7)
        };

        return Task.FromResult(response);
    }

    public Task LogoutAsync()
    {
        _currentUser = null;
        _token = null;
        return Task.CompletedTask;
    }

    public Task<bool> IsAuthenticatedAsync()
    {
        return Task.FromResult(_token != null);
    }

    public Task<UserDto?> GetCurrentUserAsync()
    {
        return Task.FromResult(_currentUser);
    }

    public Task<bool> RefreshTokenAsync()
    {
        // Mock implementation
        return Task.FromResult(true);
    }
}
