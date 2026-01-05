namespace LezzetAtlasi;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();

        // Register routes for navigation
        Routing.RegisterRoute(nameof(OnboardingPage), typeof(OnboardingPage));
        Routing.RegisterRoute(nameof(LoginPage), typeof(LoginPage));
        Routing.RegisterRoute(nameof(RegisterPage), typeof(RegisterPage));
        Routing.RegisterRoute(nameof(GourmetActivationPage), typeof(GourmetActivationPage));
        Routing.RegisterRoute(nameof(PlaceDetailPage), typeof(PlaceDetailPage));
        Routing.RegisterRoute(nameof(ReviewModalPage), typeof(ReviewModalPage));
        Routing.RegisterRoute(nameof(SettingsPage), typeof(SettingsPage));
    }
}
