namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Kayıt ekranı ViewModel
/// </summary>
public partial class RegisterViewModel : BaseViewModel
{
    private readonly IAuthService _authService;

    [ObservableProperty]
    private string email = string.Empty;

    [ObservableProperty]
    private string password = string.Empty;

    [ObservableProperty]
    private string confirmPassword = string.Empty;

    [ObservableProperty]
    private string firstName = string.Empty;

    [ObservableProperty]
    private string lastName = string.Empty;

    [ObservableProperty]
    private string phoneNumber = string.Empty;

    [ObservableProperty]
    private bool acceptTerms;

    public RegisterViewModel(INavigationService navigationService, IAuthService authService) 
        : base(navigationService)
    {
        _authService = authService;
        Title = "Kayıt Ol";
    }

    [RelayCommand]
    private async Task RegisterAsync()
    {
        if (!ValidateInputs())
            return;

        await ExecuteSafelyAsync(async () =>
        {
            var registerDto = new RegisterDto
            {
                Email = Email,
                Password = Password,
                FirstName = FirstName,
                LastName = LastName,
                PhoneNumber = PhoneNumber
            };

            var response = await _authService.RegisterAsync(registerDto);

            if (response != null)
            {
                await Application.Current!.MainPage!.DisplayAlert("Başarılı", "Kayıt başarılı! Giriş yapabilirsiniz.", "Tamam");
                await NavigationService.GoBackAsync();
            }
        }, "Kayıt olurken bir hata oluştu.");
    }

    [RelayCommand]
    private async Task NavigateToLoginAsync()
    {
        await NavigationService.GoBackAsync();
    }

    private bool ValidateInputs()
    {
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password) ||
            string.IsNullOrWhiteSpace(FirstName) || string.IsNullOrWhiteSpace(LastName))
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Tüm zorunlu alanları doldurunuz.", "Tamam");
            return false;
        }

        if (Password != ConfirmPassword)
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Şifreler eşleşmiyor.", "Tamam");
            return false;
        }

        if (Password.Length < 6)
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Şifre en az 6 karakter olmalıdır.", "Tamam");
            return false;
        }

        if (!AcceptTerms)
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Kullanım koşullarını kabul etmelisiniz.", "Tamam");
            return false;
        }

        return true;
    }
}
