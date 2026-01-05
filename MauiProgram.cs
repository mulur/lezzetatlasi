using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;

namespace LezzetAtlasi;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Register Services
        builder.Services.AddSingleton<INavigationService, NavigationService>();
        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddSingleton<IPlaceService, PlaceService>();
        builder.Services.AddSingleton<IReviewService, ReviewService>();
        builder.Services.AddSingleton<IGourmetService, GourmetService>();
        builder.Services.AddSingleton<IUserService, UserService>();

        // Register ViewModels
        builder.Services.AddTransient<OnboardingViewModel>();
        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<RegisterViewModel>();
        builder.Services.AddTransient<GourmetActivationViewModel>();
        builder.Services.AddTransient<ExploreViewModel>();
        builder.Services.AddTransient<MapViewModel>();
        builder.Services.AddTransient<PlaceDetailViewModel>();
        builder.Services.AddTransient<ReviewModalViewModel>();
        builder.Services.AddTransient<GourmetPanelViewModel>();
        builder.Services.AddTransient<ProfileViewModel>();
        builder.Services.AddTransient<SettingsViewModel>();

        // Register Views
        builder.Services.AddTransient<OnboardingPage>();
        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<RegisterPage>();
        builder.Services.AddTransient<GourmetActivationPage>();
        builder.Services.AddTransient<ExplorePage>();
        builder.Services.AddTransient<MapPage>();
        builder.Services.AddTransient<PlaceDetailPage>();
        builder.Services.AddTransient<ReviewModalPage>();
        builder.Services.AddTransient<GourmetPanelPage>();
        builder.Services.AddTransient<ProfilePage>();
        builder.Services.AddTransient<SettingsPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
