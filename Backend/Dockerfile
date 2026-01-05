# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["LezzetAtlasi.API/LezzetAtlasi.API.csproj", "LezzetAtlasi.API/"]
COPY ["LezzetAtlasi.Core/LezzetAtlasi.Core.csproj", "LezzetAtlasi.Core/"]
COPY ["LezzetAtlasi.Infrastructure/LezzetAtlasi.Infrastructure.csproj", "LezzetAtlasi.Infrastructure/"]
RUN dotnet restore "LezzetAtlasi.API/LezzetAtlasi.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/LezzetAtlasi.API"
RUN dotnet build "LezzetAtlasi.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "LezzetAtlasi.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "LezzetAtlasi.API.dll"]
