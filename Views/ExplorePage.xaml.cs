namespace LezzetAtlasi.Views;

public partial class ExplorePage : ContentPage
{
    public ExplorePage(ExploreViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is BaseViewModel viewModel)
        {
            await viewModel.OnAppearingAsync();
        }
    }
}
