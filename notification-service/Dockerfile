# Use the official .NET SDK image to build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY NotificationService/NotificationService.csproj ./NotificationService/
WORKDIR /app/NotificationService
RUN dotnet restore

# Copy everything else and build
COPY NotificationService/. ./
RUN dotnet publish -c Release -o /app/out

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Start the app
ENTRYPOINT ["dotnet", "NotificationService.dll"]
