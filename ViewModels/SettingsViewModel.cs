namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Ayarlar ekranı ViewModel
/// </summary>
public partial class SettingsViewModel : BaseViewModel
{
    private readonly IUserService _userService;

    [ObservableProperty]
    private bool notificationsEnabled;

    [ObservableProperty]
    private bool locationEnabled;

    [ObservableProperty]
    private string selectedLanguage = "tr";

    public ObservableCollection<string> Languages { get; } = new()
    {
        "Türkçe (tr)",
        "English (en)",
        "Deutsch (de)"
    };

    [ObservableProperty]
    private ObservableCollection<string> favoriteCuisines = new();

    public ObservableCollection<string> AvailableCuisines { get; } = new()
    {
        "Türk",
        "İtalyan",
        "Fransız",
        "Japon",
        "Çin",
        "Hint",
        "Meksika",
        "Akdeniz"
    };

    public SettingsViewModel(INavigationService navigationService, IUserService userService) 
        : base(navigationService)
    {
        _userService = userService;
        Title = "Ayarlar";
    }

    public override async Task OnAppearingAsync()
    {
        await base.OnAppearingAsync();
        await LoadSettingsAsync();
    }

    [RelayCommand]
    private async Task LoadSettingsAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            var user = await _userService.GetCurrentUserProfileAsync();
            if (user?.Preferences != null)
            {
                NotificationsEnabled = user.Preferences.NotificationsEnabled;
                LocationEnabled = user.Preferences.LocationEnabled;
                SelectedLanguage = user.Preferences.PreferredLanguage;
                FavoriteCuisines = new ObservableCollection<string>(user.Preferences.FavoriteCuisines);
            }
        });
    }

    [RelayCommand]
    private async Task SaveSettingsAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            var preferences = new UserPreferencesDto
            {
                NotificationsEnabled = NotificationsEnabled,
                LocationEnabled = LocationEnabled,
                PreferredLanguage = SelectedLanguage,
                FavoriteCuisines = FavoriteCuisines.ToList()
            };

            var success = await _userService.UpdateUserPreferencesAsync(preferences);
            if (success)
            {
                await Application.Current!.MainPage!.DisplayAlert("Başarılı", "Ayarlar kaydedildi.", "Tamam");
            }
        }, "Ayarlar kaydedilirken bir hata oluştu.");
    }

    [RelayCommand]
    private void ToggleCuisine(string cuisine)
    {
        if (FavoriteCuisines.Contains(cuisine))
        {
            FavoriteCuisines.Remove(cuisine);
        }
        else
        {
            FavoriteCuisines.Add(cuisine);
        }
    }

    [RelayCommand]
    private async Task ClearCacheAsync()
    {
        var result = await Application.Current!.MainPage!.DisplayAlert(
            "Onay", 
            "Önbelleği temizlemek istediğinizden emin misiniz?", 
            "Evet", 
            "Hayır");

        if (result)
        {
            await Application.Current!.MainPage!.DisplayAlert("Başarılı", "Önbellek temizlendi.", "Tamam");
        }
    }

    [RelayCommand]
    private async Task ShowAboutAsync()
    {
        await Application.Current!.MainPage!.DisplayAlert(
            "Lezzet Atlası", 
            "Versiyon: 1.0.0\n\nLezzet Atlası, en iyi yemek mekanlarını keşfetmenizi sağlayan bir platformdur.", 
            "Tamam");
    }

    [RelayCommand]
    private async Task ShowPrivacyPolicyAsync()
    {
        await Application.Current!.MainPage!.DisplayAlert("Bilgi", "Gizlilik politikası yakında eklenecek.", "Tamam");
    }

    [RelayCommand]
    private async Task ShowTermsAsync()
    {
        await Application.Current!.MainPage!.DisplayAlert("Bilgi", "Kullanım koşulları yakında eklenecek.", "Tamam");
    }

    [RelayCommand]
    private async Task ContactSupportAsync()
    {
        try
        {
            await Email.ComposeAsync(new EmailMessage
            {
                Subject = "Lezzet Atlası Destek",
                To = new List<string> { "support@lezzetatlasi.com" }
            });
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "E-posta uygulaması açılamadı.");
        }
    }
}
