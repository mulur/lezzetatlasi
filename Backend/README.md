# Lezzet Atlası - Backend API

A comprehensive .NET backend API for the Lezzet Atlası restaurant review and gourmet platform.

## Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens, role-based access control (User, Gourmet, Admin)
- **User Management**: ASP.NET Core Identity integration with invite code system for Gourmet users
- **Place Management**: CRUD operations for restaurants/places with geolocation support
- **Rating System**: Unified rating system for both regular users and gourmets with detailed criteria
- **Comment System**: Comments with moderation and reaction support
- **Gourmet Ranking**: Dynamic ranking system for gourmet users based on activity and quality
- **Caching**: Memory cache with support for Redis
- **Rate Limiting**: IP-based rate limiting to prevent abuse

## Tech Stack

- **.NET 10**: Latest .NET framework
- **ASP.NET Core Web API**: RESTful API framework
- **Entity Framework Core 10**: ORM for database operations
- **PostgreSQL**: Primary database with PostGIS extension for geospatial data
- **ASP.NET Core Identity**: User authentication and authorization
- **JWT**: JSON Web Tokens for stateless authentication
- **Swagger/OpenAPI**: API documentation and testing
- **xUnit**: Unit and integration testing framework

## Architecture

The project follows Clean Architecture principles with three main layers:

- **LezzetAtlasi.API**: Presentation layer (Controllers, Middleware, DTOs)
- **LezzetAtlasi.Core**: Domain layer (Entities, Interfaces, Enums)
- **LezzetAtlasi.Infrastructure**: Data layer (DbContext, Repositories, Services)
- **LezzetAtlasi.Tests**: Test project

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [PostgreSQL 13+](https://www.postgresql.org/download/) with PostGIS extension
- [Docker](https://www.docker.com/) (optional, for containerized development)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mulur/lezzetatlasi.git
cd lezzetatlasi/Backend
```

### 2. Configure Database

Update the connection string in `LezzetAtlasi.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=lezzetatlasi;Username=YOUR_USERNAME;Password=YOUR_PASSWORD"
  }
}
```

### 3. Install PostgreSQL with PostGIS

**Using Docker:**

```bash
docker run --name lezzetatlasi-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lezzetatlasi \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4
```

**Manual Installation:**

```sql
CREATE DATABASE lezzetatlasi;
\c lezzetatlasi
CREATE EXTENSION postgis;
```

### 4. Apply Migrations

```bash
cd LezzetAtlasi.API
dotnet ef migrations add InitialCreate --project ../LezzetAtlasi.Infrastructure --startup-project .
dotnet ef database update --project ../LezzetAtlasi.Infrastructure --startup-project .
```

### 5. Configure JWT Secret

Update the JWT secret in `appsettings.json` or use environment variables:

```json
{
  "JwtSettings": {
    "Secret": "YOUR_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG",
    "Issuer": "LezzetAtlasiAPI",
    "Audience": "LezzetAtlasiClients"
  }
}
```

**Using environment variables (recommended for production):**

```bash
export JwtSettings__Secret="YOUR_SECRET_KEY"
```

### 6. Run the Application

```bash
dotnet run --project LezzetAtlasi.API
```

The API will be available at:
- HTTPS: `https://localhost:7001`
- HTTP: `http://localhost:5001`
- Swagger UI: `https://localhost:7001/swagger`

## Database Schema

The database includes the following main entities:

- **Users**: User accounts with Identity integration
- **GourmetProfiles**: Extended profiles for gourmet users
- **GourmetRanks**: Ranking tiers for gourmet users
- **InviteCodes**: Invite codes for gourmet registration
- **Places**: Restaurants and dining establishments
- **Categories**: Place categories (hierarchical)
- **PlaceRatings**: User and gourmet ratings
- **PlaceComments**: User comments on places
- **PlaceRatingSummary**: Aggregated rating statistics
- **PlacePhotos**: Photo uploads for places
- **PlaceMenus & MenuItems**: Menu management
- **PriceHistory**: Price tracking for menu items

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/register/gourmet` - Register with invite code (Gourmet)
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Places
- `GET /api/places` - List places (with filtering, sorting, pagination)
- `GET /api/places/{id}` - Get place details
- `POST /api/places` - Create place (Gourmet/Admin only)
- `PUT /api/places/{id}` - Update place (Gourmet/Admin only)
- `DELETE /api/places/{id}` - Delete place (Admin only)

### Ratings
- `GET /api/places/{id}/ratings` - Get ratings for a place
- `POST /api/places/{id}/ratings` - Add/update rating
- `DELETE /api/ratings/{id}` - Delete own rating

### Comments
- `GET /api/places/{id}/comments` - Get comments for a place
- `POST /api/places/{id}/comments` - Add comment
- `PUT /api/comments/{id}` - Update own comment
- `DELETE /api/comments/{id}` - Delete own comment

## Default Users

The application seeds three demo users:

1. **Admin**
   - Email: `admin@lezzetatlasi.com`
   - Password: `Admin123!`
   - Role: Admin

2. **Gourmet**
   - Email: `gourmet@example.com`
   - Password: `Gourmet123!`
   - Role: Gourmet

3. **User**
   - Email: `user@example.com`
   - Password: `User123!`
   - Role: User

## Development

### Running Tests

```bash
dotnet test
```

### Building the Solution

```bash
dotnet build
```

### Generating Migrations

```bash
dotnet ef migrations add MigrationName --project LezzetAtlasi.Infrastructure --startup-project LezzetAtlasi.API
```

## Configuration

### Rate Limiting

Configure rate limiting in `appsettings.json`:

```json
{
  "RateLimiting": {
    "EnableEndpointRateLimiting": true,
    "GeneralRules": [
      {
        "Endpoint": "*",
        "Period": "1m",
        "Limit": 100
      }
    ]
  }
}
```

### Caching

Configure cache expiration times:

```json
{
  "Cache": {
    "DefaultExpirationMinutes": 5,
    "PlaceDetailExpirationMinutes": 10,
    "RatingSummaryExpirationMinutes": 1
  }
}
```

## Docker Support

### Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL with PostGIS
- Redis (optional)
- The API application

## Security

- JWT tokens with configurable expiration
- Refresh token rotation
- Rate limiting
- HTTPS enforcement
- CORS configuration
- Password complexity requirements
- Account lockout after failed attempts

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please create an issue on GitHub.
