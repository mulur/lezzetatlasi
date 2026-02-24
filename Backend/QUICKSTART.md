# Quick Start Guide - Lezzet Atlası Backend

This guide will help you get the backend API running locally in under 5 minutes.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Step 1: Start PostgreSQL Database

```bash
cd Backend
docker-compose up -d postgres
```

This starts PostgreSQL with PostGIS extension on port 5432.

## Step 2: Create Database Migration

```bash
cd LezzetAtlasi.API
dotnet ef migrations add InitialCreate --project ../LezzetAtlasi.Infrastructure
```

## Step 3: Apply Database Migration

```bash
dotnet ef database update --project ../LezzetAtlasi.Infrastructure
```

This will:
- Create all database tables
- Set up relationships and indexes
- Seed demo users and gourmet ranks

## Step 4: Run the API

```bash
dotnet run
```

The API will start on:
- HTTPS: https://localhost:7001
- HTTP: http://localhost:5001

## Step 5: Test the API

Open your browser and navigate to:
```
https://localhost:7001/swagger
```

You'll see the Swagger UI with all available endpoints.

## Demo Users

Three users are automatically created:

### Admin User
- **Email**: `admin@lezzetatlasi.com`
- **Password**: `Admin123!`
- **Role**: Admin

### Gourmet User
- **Email**: `gourmet@example.com`
- **Password**: `Gourmet123!`
- **Role**: Gourmet

### Regular User
- **Email**: `user@example.com`
- **Password**: `User123!`
- **Role**: User

## Testing Authentication

1. In Swagger UI, find the `/api/auth/login` endpoint (when implemented)
2. Click "Try it out"
3. Enter credentials (e.g., admin@lezzetatlasi.com / Admin123!)
4. Click "Execute"
5. Copy the `accessToken` from the response
6. Click the "Authorize" button at the top
7. Enter: `Bearer YOUR_ACCESS_TOKEN`
8. Now you can test protected endpoints

## Troubleshooting

### Database Connection Error
If you get a connection error:
```bash
# Check if PostgreSQL is running
docker ps

# View PostgreSQL logs
docker logs lezzetatlasi-db

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use
If ports 5001 or 7001 are in use, edit `Properties/launchSettings.json`:
```json
{
  "applicationUrl": "https://localhost:YOUR_PORT;http://localhost:YOUR_PORT"
}
```

### Migration Error
If migration fails:
```bash
# Drop the database and start over
docker-compose down -v
docker-compose up -d postgres

# Wait 10 seconds for PostgreSQL to start
sleep 10

# Try migration again
cd LezzetAtlasi.API
dotnet ef database update --project ../LezzetAtlasi.Infrastructure
```

## Next Steps

After verifying the API runs successfully:

1. Review `IMPLEMENTATION_STATUS.md` for remaining work
2. Check `README.md` for comprehensive documentation
3. Start implementing authentication services (highest priority)

## Common Commands

```bash
# Build solution
dotnet build

# Run tests
dotnet test

# Clean build
dotnet clean

# Create new migration
dotnet ef migrations add MigrationName --project ../LezzetAtlasi.Infrastructure

# Revert last migration
dotnet ef migrations remove --project ../LezzetAtlasi.Infrastructure

# View database
docker exec -it lezzetatlasi-db psql -U postgres -d lezzetatlasi

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Development Workflow

1. Make code changes
2. Build to verify: `dotnet build`
3. If entity changes: Create migration
4. Run tests: `dotnet test`
5. Start API: `dotnet run`
6. Test in Swagger or Postman
7. Commit changes

## Getting Help

- Check `README.md` for detailed documentation
- Review `IMPLEMENTATION_STATUS.md` for implementation roadmap
- Create an issue on GitHub for questions

Happy coding! 🚀
