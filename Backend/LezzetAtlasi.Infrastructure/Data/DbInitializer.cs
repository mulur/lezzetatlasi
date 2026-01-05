using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using LezzetAtlasi.Core.Entities;

namespace LezzetAtlasi.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
    {
        // Ensure database is created
        await context.Database.MigrateAsync();

        // Seed Roles
        await SeedRolesAsync(roleManager);

        // Seed Gourmet Ranks
        await SeedGourmetRanksAsync(context);

        // Seed Demo Users (optional)
        await SeedDemoUsersAsync(userManager, context);
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        string[] roleNames = { "User", "Gourmet", "Admin" };

        foreach (var roleName in roleNames)
        {
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                await roleManager.CreateAsync(new ApplicationRole(roleName));
            }
        }
    }

    private static async Task SeedGourmetRanksAsync(ApplicationDbContext context)
    {
        if (await context.GourmetRanks.AnyAsync())
        {
            return; // Already seeded
        }

        var ranks = new[]
        {
            new GourmetRank
            {
                Id = 1,
                Name = "Yeni Keşifçi",
                MinScore = 0,
                MaxScore = 100,
                Color = "#9E9E9E",
                Icon = "🧭",
                DisplayOrder = 1,
                Benefits = "{\"description\":\"Platformda yeni keşiflere başlıyorsunuz!\"}"
            },
            new GourmetRank
            {
                Id = 2,
                Name = "Meraklı Damak",
                MinScore = 100,
                MaxScore = 300,
                Color = "#FF9800",
                Icon = "🍴",
                DisplayOrder = 2,
                Benefits = "{\"description\":\"Lezzet dünyasında keşifleriniz artıyor!\"}"
            },
            new GourmetRank
            {
                Id = 3,
                Name = "Lezzet Avcısı",
                MinScore = 300,
                MaxScore = 600,
                Color = "#4CAF50",
                Icon = "🔍",
                DisplayOrder = 3,
                Benefits = "{\"description\":\"Yemek arayışınız bir tutkuya dönüşüyor!\"}"
            },
            new GourmetRank
            {
                Id = 4,
                Name = "Gastronomi Tutkunu",
                MinScore = 600,
                MaxScore = 1000,
                Color = "#2196F3",
                Icon = "❤️",
                DisplayOrder = 4,
                Benefits = "{\"description\":\"Gastronomi tutkununuz herkes tarafından takdir ediliyor!\"}"
            },
            new GourmetRank
            {
                Id = 5,
                Name = "Gurme Uzman",
                MinScore = 1000,
                MaxScore = 2000,
                Color = "#9C27B0",
                Icon = "⭐",
                DisplayOrder = 5,
                Benefits = "{\"description\":\"Deneyiminiz ve bilginizle bir referans oldunuz!\"}"
            },
            new GourmetRank
            {
                Id = 6,
                Name = "Master Gurme",
                MinScore = 2000,
                MaxScore = 999999,
                Color = "#FFD700",
                Icon = "👑",
                DisplayOrder = 6,
                Benefits = "{\"description\":\"Lezzet dünyasının masterı olarak ayrıcalıklı konumdasınız!\"}"
            }
        };

        await context.GourmetRanks.AddRangeAsync(ranks);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoUsersAsync(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        // Create admin user
        if (await userManager.FindByEmailAsync("admin@lezzetatlasi.com") == null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin",
                Email = "admin@lezzetatlasi.com",
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // Create demo gourmet user
        if (await userManager.FindByEmailAsync("gourmet@example.com") == null)
        {
            var gourmetUser = new ApplicationUser
            {
                UserName = "gourmet_demo",
                Email = "gourmet@example.com",
                FirstName = "Demo",
                LastName = "Gourmet",
                EmailConfirmed = true,
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(gourmetUser, "Gourmet123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(gourmetUser, "Gourmet");
                
                // Create gourmet profile
                var gourmetProfile = new GourmetProfile
                {
                    UserId = gourmetUser.Id,
                    Bio = "Demo gourmet user for testing",
                    TotalScore = 150,
                    CurrentRankId = 2 // Meraklı Damak
                };
                context.GourmetProfiles.Add(gourmetProfile);
                await context.SaveChangesAsync();
            }
        }

        // Create demo regular user
        if (await userManager.FindByEmailAsync("user@example.com") == null)
        {
            var regularUser = new ApplicationUser
            {
                UserName = "user_demo",
                Email = "user@example.com",
                FirstName = "Demo",
                LastName = "User",
                EmailConfirmed = true,
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(regularUser, "User123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(regularUser, "User");
            }
        }
    }
}
