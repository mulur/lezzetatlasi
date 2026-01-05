namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Onboarding ekranı ViewModel
/// Uygulama ilk açılışta kullanıcıya tanıtım yapar
/// </summary>
public partial class OnboardingViewModel : BaseViewModel
{
    [ObservableProperty]
    private int currentPage;

    [ObservableProperty]
    private bool isLastPage;

    public ObservableCollection<OnboardingItem> OnboardingItems { get; } = new();

    public OnboardingViewModel(INavigationService navigationService) : base(navigationService)
    {
        Title = "Lezzet Atlası'na Hoş Geldiniz";
        InitializeOnboardingItems();
    }

    private void InitializeOnboardingItems()
    {
        OnboardingItems.Add(new OnboardingItem
        {
            Title = "Lezzetli Mekanları Keşfet",
            Description = "Şehrinizin en iyi restoran ve kafelerini keşfedin",
            ImageUrl = "onboarding1.png"
        });

        OnboardingItems.Add(new OnboardingItem
        {
            Title = "Gurme Yorumlarını İncele",
            Description = "Uzman gurmelerden öneriler alın ve deneyimlerini okuyun",
            ImageUrl = "onboarding2.png"
        });

        OnboardingItems.Add(new OnboardingItem
        {
            Title = "Deneyimlerini Paylaş",
            Description = "Gittiğiniz mekanları değerlendirin ve topluluğa katkıda bulunun",
            ImageUrl = "onboarding3.png"
        });
    }

    [RelayCommand]
    private async Task NextAsync()
    {
        if (CurrentPage < OnboardingItems.Count - 1)
        {
            CurrentPage++;
            IsLastPage = CurrentPage == OnboardingItems.Count - 1;
        }
        else
        {
            await CompleteOnboardingAsync();
        }
    }

    [RelayCommand]
    private async Task SkipAsync()
    {
        await CompleteOnboardingAsync();
    }

    private async Task CompleteOnboardingAsync()
    {
        // Save that onboarding is completed
        Preferences.Set("OnboardingCompleted", true);
        
        // Navigate to login
        await NavigationService.NavigateToAsync(nameof(LoginPage));
    }

    partial void OnCurrentPageChanged(int value)
    {
        IsLastPage = value == OnboardingItems.Count - 1;
    }
}

public class OnboardingItem
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}
