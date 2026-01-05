namespace LezzetAtlasi.Views;

public partial class GourmetActivationPage : ContentPage
{
    public GourmetActivationPage(GourmetActivationViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
