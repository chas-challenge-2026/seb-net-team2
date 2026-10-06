# Multi-stage build — build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY SebPortal.Api.csproj .
RUN dotnet restore SebPortal.Api.csproj

COPY . .
RUN dotnet publish SebPortal.Api.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8081
EXPOSE 8081

ENTRYPOINT ["dotnet", "SebPortal.Api.dll"]