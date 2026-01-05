namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Gurme aktivasyon ekranı ViewModel
/// Kullanıcıların gurme hesabı açması için başvuru formu
/// </summary>
public partial class GourmetActivationViewModel : BaseViewModel
{
    private readonly IGourmetService _gourmetService;

    [ObservableProperty]
    private string displayName = string.Empty;

    [ObservableProperty]
    private string bio = string.Empty;

    [ObservableProperty]
    private string experienceDescription = string.Empty;

    [ObservableProperty]
    private string selectedVerificationType = "FoodBlogger";

    public ObservableCollection<string> VerificationTypes { get; } = new()
    {
        "Chef",
        "FoodCritic",
        "FoodBlogger",
        "Culinary Expert",
        "Restaurant Owner"
    };

    public ObservableCollection<string> SelectedSpecializations { get; } = new();

    public ObservableCollection<string> AvailableSpecializations { get; } = new()
    {
        "Türk Mutfağı",
        "İtalyan Mutfağı",
        "Fransız Mutfağı",
        "Japon Mutfağı",
        "Çin Mutfağı",
        "Hint Mutfağı",
        "Meksika Mutfağı",
        "Akdeniz Mutfağı",
        "Vejeteryan",
        "Vegan",
        "Pasta & Tatlı",
        "Street Food"
    };

    public GourmetActivationViewModel(INavigationService navigationService, IGourmetService gourmetService) 
        : base(navigationService)
    {
        _gourmetService = gourmetService;
        Title = "Gurme Ol";
    }

    [RelayCommand]
    private void ToggleSpecialization(string specialization)
    {
        if (SelectedSpecializations.Contains(specialization))
        {
            SelectedSpecializations.Remove(specialization);
        }
        else
        {
            SelectedSpecializations.Add(specialization);
        }
    }

    [RelayCommand]
    private async Task SubmitApplicationAsync()
    {
        if (!ValidateInputs())
            return;

        await ExecuteSafelyAsync(async () =>
        {
            var request = new GourmetActivationRequestDto
            {
                DisplayName = DisplayName,
                Bio = Bio,
                Specializations = SelectedSpecializations.ToList(),
                VerificationType = SelectedVerificationType,
                ExperienceDescription = ExperienceDescription
            };

            var success = await _gourmetService.ActivateGourmetAsync(request);

            if (success)
            {
                await Application.Current!.MainPage!.DisplayAlert(
                    "Başarılı", 
                    "Gurme başvurunuz alındı! İnceleme süreci başladı.", 
                    "Tamam");
                await NavigationService.GoBackAsync();
            }
        }, "Başvuru gönderilirken bir hata oluştu.");
    }

    [RelayCommand]
    private async Task CancelAsync()
    {
        await NavigationService.GoBackAsync();
    }

    private bool ValidateInputs()
    {
        if (string.IsNullOrWhiteSpace(DisplayName))
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Görünen adınızı giriniz.", "Tamam");
            return false;
        }

        if (string.IsNullOrWhiteSpace(Bio))
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Biyografinizi giriniz.", "Tamam");
            return false;
        }

        if (SelectedSpecializations.Count == 0)
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "En az bir uzmanlık alanı seçiniz.", "Tamam");
            return false;
        }

        if (string.IsNullOrWhiteSpace(ExperienceDescription))
        {
            Application.Current!.MainPage!.DisplayAlert("Uyarı", "Deneyiminizi açıklayınız.", "Tamam");
            return false;
        }

        return true;
    }
}
