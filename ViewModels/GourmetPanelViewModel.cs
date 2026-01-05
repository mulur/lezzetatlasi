namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Gurme paneli ekranı ViewModel
/// Gurme kullanıcılar için özel panel
/// </summary>
public partial class GourmetPanelViewModel : BaseViewModel
{
    private readonly IGourmetService _gourmetService;
    private readonly IReviewService _reviewService;
    private readonly IUserService _userService;

    [ObservableProperty]
    private GourmetDto? gourmetProfile;

    [ObservableProperty]
    private ObservableCollection<ReviewDto> myReviews = new();

    [ObservableProperty]
    private ObservableCollection<GourmetListItemDto> followingGourmets = new();

    [ObservableProperty]
    private bool isGourmet;

    public GourmetPanelViewModel(
        INavigationService navigationService, 
        IGourmetService gourmetService,
        IReviewService reviewService,
        IUserService userService) 
        : base(navigationService)
    {
        _gourmetService = gourmetService;
        _reviewService = reviewService;
        _userService = userService;
        Title = "Gurme Paneli";
    }

    public override async Task OnAppearingAsync()
    {
        await base.OnAppearingAsync();
        await LoadDataAsync();
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            var currentUser = await _userService.GetCurrentUserProfileAsync();
            IsGourmet = currentUser?.IsGourmet ?? false;

            if (IsGourmet)
            {
                var profileTask = _gourmetService.GetCurrentUserGourmetProfileAsync();
                var reviewsTask = _reviewService.GetUserReviewsAsync(currentUser!.Id);

                await Task.WhenAll(profileTask, reviewsTask);

                GourmetProfile = profileTask.Result;
                MyReviews = new ObservableCollection<ReviewDto>(reviewsTask.Result);
            }

            IsRefreshing = false;
        });
    }

    [RelayCommand]
    private async Task ActivateGourmetAsync()
    {
        await NavigationService.NavigateToAsync(nameof(GourmetActivationPage));
    }

    [RelayCommand]
    private async Task EditProfileAsync()
    {
        await Application.Current!.MainPage!.DisplayAlert("Bilgi", "Profil düzenleme özelliği yakında eklenecek.", "Tamam");
    }

    [RelayCommand]
    private async Task ViewStatsAsync()
    {
        if (GourmetProfile == null)
            return;

        var stats = GourmetProfile.Stats;
        var message = $"Toplam Yorum: {stats.TotalReviews}\n" +
                     $"Takipçi: {stats.FollowersCount}\n" +
                     $"Takip Edilen: {stats.FollowingCount}\n" +
                     $"Ziyaret Edilen Mekan: {stats.PlacesVisited}\n" +
                     $"Ortalama Puan: {stats.AverageRating:F1}";

        await Application.Current!.MainPage!.DisplayAlert("İstatistikler", message, "Tamam");
    }

    [RelayCommand]
    private async Task SelectReviewAsync(ReviewDto review)
    {
        if (review == null)
            return;

        var parameters = new Dictionary<string, object>
        {
            { "PlaceId", review.PlaceId }
        };

        await NavigationService.NavigateToAsync(nameof(PlaceDetailPage), parameters);
    }
}
