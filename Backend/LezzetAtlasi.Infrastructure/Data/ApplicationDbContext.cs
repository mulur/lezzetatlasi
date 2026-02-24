using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using LezzetAtlasi.Core.Entities;

namespace LezzetAtlasi.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, long>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<InviteCode> InviteCodes => Set<InviteCode>();
    public DbSet<GourmetProfile> GourmetProfiles => Set<GourmetProfile>();
    public DbSet<GourmetRank> GourmetRanks => Set<GourmetRank>();
    public DbSet<GourmetScoreSnapshot> GourmetScoreSnapshots => Set<GourmetScoreSnapshot>();
    public DbSet<Place> Places => Set<Place>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<PlaceCategory> PlaceCategories => Set<PlaceCategory>();
    public DbSet<PlacePhoto> PlacePhotos => Set<PlacePhoto>();
    public DbSet<PlaceMenu> PlaceMenus => Set<PlaceMenu>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<PriceHistory> PriceHistories => Set<PriceHistory>();
    public DbSet<PlaceRating> PlaceRatings => Set<PlaceRating>();
    public DbSet<PlaceComment> PlaceComments => Set<PlaceComment>();
    public DbSet<CommentReaction> CommentReactions => Set<CommentReaction>();
    public DbSet<PlaceRatingSummary> PlaceRatingSummaries => Set<PlaceRatingSummary>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure table names
        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<ApplicationRole>().ToTable("Roles");
        
        // Configure relationships and constraints
        ConfigureIdentity(builder);
        ConfigureInviteCodes(builder);
        ConfigureGourmetProfiles(builder);
        ConfigurePlaces(builder);
        ConfigureRatingsAndComments(builder);
        ConfigureIndexes(builder);
    }

    private void ConfigureIdentity(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UserName).IsUnique();
        });

        // RefreshToken configuration
        builder.Entity<RefreshToken>(entity =>
        {
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => new { e.UserId, e.IsRevoked });
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureInviteCodes(ModelBuilder builder)
    {
        builder.Entity<InviteCode>(entity =>
        {
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => new { e.IsActive, e.ExpiresAt });
            
            entity.HasOne(e => e.Creator)
                .WithMany(u => u.CreatedInviteCodes)
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(e => e.User)
                .WithMany(u => u.UsedInviteCodes)
                .HasForeignKey(e => e.UsedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureGourmetProfiles(ModelBuilder builder)
    {
        builder.Entity<GourmetProfile>(entity =>
        {
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.TotalScore).HasPrecision(10, 2);
            
            entity.HasOne(e => e.User)
                .WithOne(u => u.GourmetProfile)
                .HasForeignKey<GourmetProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.CurrentRank)
                .WithMany(r => r.GourmetProfiles)
                .HasForeignKey(e => e.CurrentRankId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<GourmetRank>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.MinScore).HasPrecision(10, 2);
            entity.Property(e => e.MaxScore).HasPrecision(10, 2);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.DisplayOrder);
        });

        builder.Entity<GourmetScoreSnapshot>(entity =>
        {
            entity.Property(e => e.Score).HasPrecision(10, 2);
            entity.HasIndex(e => new { e.GourmetId, e.SnapshotDate });
            
            entity.HasOne(e => e.Gourmet)
                .WithMany(g => g.ScoreSnapshots)
                .HasForeignKey(e => e.GourmetId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Rank)
                .WithMany(r => r.ScoreSnapshots)
                .HasForeignKey(e => e.RankId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private void ConfigurePlaces(ModelBuilder builder)
    {
        builder.Entity<Place>(entity =>
        {
            entity.HasQueryFilter(p => p.Status != Core.Enums.PlaceStatus.Deleted);
            
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Latitude).HasPrecision(10, 8);
            entity.Property(e => e.Longitude).HasPrecision(11, 8);
            
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => new { e.City, e.Status });
            entity.HasIndex(e => e.Location).HasMethod("GIST");
            
            entity.HasOne(e => e.Creator)
                .WithMany(u => u.CreatedPlaces)
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Category>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => new { e.IsActive, e.SortOrder });
            
            entity.HasOne(e => e.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PlaceCategory>(entity =>
        {
            entity.HasKey(e => new { e.PlaceId, e.CategoryId });
            
            entity.HasOne(e => e.Place)
                .WithMany(p => p.PlaceCategories)
                .HasForeignKey(e => e.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.Category)
                .WithMany(c => c.PlaceCategories)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlacePhoto>(entity =>
        {
            entity.Property(e => e.PhotoUrl).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => new { e.PlaceId, e.DisplayOrder });
            
            entity.HasOne(e => e.Place)
                .WithMany(p => p.Photos)
                .HasForeignKey(e => e.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.User)
                .WithMany(u => u.Photos)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PlaceMenu>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            
            entity.HasOne(e => e.Place)
                .WithMany(p => p.Menus)
                .HasForeignKey(e => e.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<MenuItem>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Price).HasPrecision(10, 2);
            entity.Property(e => e.Currency).HasMaxLength(10);
            
            entity.HasOne(e => e.Menu)
                .WithMany(m => m.MenuItems)
                .HasForeignKey(e => e.MenuId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PriceHistory>(entity =>
        {
            entity.Property(e => e.Price).HasPrecision(10, 2);
            entity.Property(e => e.Currency).HasMaxLength(10);
            entity.HasIndex(e => new { e.MenuItemId, e.RecordedAt });
            
            entity.HasOne(e => e.MenuItem)
                .WithMany(m => m.PriceHistory)
                .HasForeignKey(e => e.MenuItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureRatingsAndComments(ModelBuilder builder)
    {
        builder.Entity<PlaceRating>(entity =>
        {
            entity.Property(e => e.Rating).HasPrecision(2, 1);
            entity.Property(e => e.FoodQualityRating).HasPrecision(2, 1);
            entity.Property(e => e.PresentationRating).HasPrecision(2, 1);
            entity.Property(e => e.ServiceRating).HasPrecision(2, 1);
            entity.Property(e => e.AmbianceRating).HasPrecision(2, 1);
            entity.Property(e => e.ValueRating).HasPrecision(2, 1);
            
            entity.HasIndex(e => new { e.PlaceId, e.UserId }).IsUnique();
            entity.HasIndex(e => new { e.PlaceId, e.Status });
            entity.HasIndex(e => new { e.IsGourmet, e.Status });
            
            entity.HasOne(e => e.Place)
                .WithMany(p => p.Ratings)
                .HasForeignKey(e => e.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.User)
                .WithMany(u => u.Ratings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PlaceComment>(entity =>
        {
            entity.Property(e => e.CommentText).IsRequired();
            entity.HasIndex(e => new { e.PlaceId, e.IsApproved });
            
            entity.HasOne(e => e.Place)
                .WithMany(p => p.Comments)
                .HasForeignKey(e => e.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(e => e.Rating)
                .WithOne(r => r.Comment)
                .HasForeignKey<PlaceComment>(e => e.RatingId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<CommentReaction>(entity =>
        {
            entity.Property(e => e.ReactionType).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => new { e.CommentId, e.UserId, e.ReactionType }).IsUnique();
            
            entity.HasOne(e => e.Comment)
                .WithMany(c => c.Reactions)
                .HasForeignKey(e => e.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlaceRatingSummary>(entity =>
        {
            entity.HasKey(e => e.PlaceId);
            
            entity.Property(e => e.AverageRating).HasPrecision(3, 2);
            entity.Property(e => e.AverageUserRating).HasPrecision(3, 2);
            entity.Property(e => e.AverageGourmetRating).HasPrecision(3, 2);
            entity.Property(e => e.AverageFoodQuality).HasPrecision(3, 2);
            entity.Property(e => e.AveragePresentation).HasPrecision(3, 2);
            entity.Property(e => e.AverageService).HasPrecision(3, 2);
            entity.Property(e => e.AverageAmbiance).HasPrecision(3, 2);
            entity.Property(e => e.AverageValue).HasPrecision(3, 2);
            
            entity.HasOne(e => e.Place)
                .WithOne(p => p.RatingSummary)
                .HasForeignKey<PlaceRatingSummary>(e => e.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureIndexes(ModelBuilder builder)
    {
        // Additional performance indexes
        builder.Entity<PlaceRating>()
            .HasIndex(p => p.CreatedAt);
            
        builder.Entity<PlaceComment>()
            .HasIndex(p => p.CreatedAt);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;
            
            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }
            
            entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
