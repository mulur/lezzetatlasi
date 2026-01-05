namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Login ekranı ViewModel
/// </summary>
public partial class LoginViewModel : BaseViewModel
{
    private readonly IAuthService _authService;

    [ObservableProperty]
    private string email = string.Empty;

    [ObservableProperty]
    private string password = string.Empty;

    [ObservableProperty]
    private bool rememberMe;

    public LoginViewModel(INavigationService navigationService, IAuthService authService) 
        : base(navigationService)
    {
        _authService = authService;
        Title = "Giriş Yap";
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            await Application.Current!.MainPage!.DisplayAlert("Uyarı", "Email ve şifre alanları boş bırakılamaz.", "Tamam");
            return;
        }

        await ExecuteSafelyAsync(async () =>
        {
            var loginDto = new LoginDto
            {
                Email = Email,
                Password = Password,
                RememberMe = RememberMe
            };

            var response = await _authService.LoginAsync(loginDto);

            if (response != null)
            {
                await Application.Current!.MainPage!.DisplayAlert("Başarılı", "Giriş başarılı!", "Tamam");
                await NavigationService.NavigateToRootAsync();
            }
        }, "Giriş yapılırken bir hata oluştu.");
    }

    [RelayCommand]
    private async Task NavigateToRegisterAsync()
    {
        await NavigationService.NavigateToAsync(nameof(RegisterPage));
    }

    [RelayCommand]
    private async Task ForgotPasswordAsync()
    {
        await Application.Current!.MainPage!.DisplayAlert("Bilgi", "Şifre sıfırlama özelliği yakında eklenecek.", "Tamam");
    }
}
