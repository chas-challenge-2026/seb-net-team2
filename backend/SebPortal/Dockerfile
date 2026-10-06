# Multi-stage build — build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/SebPortal/SebPortal.Api.csproj backend/SebPortal/
RUN dotnet restore backend/SebPortal/SebPortal.Api.csproj

COPY backend/SebPortal/ backend/SebPortal/
COPY native/ native/
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev make libssl-dev \
    && rm -rf /var/lib/apt/lists/*
RUN make -C native
RUN dotnet publish backend/SebPortal/SebPortal.Api.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8081
EXPOSE 8081

ENTRYPOINT ["dotnet", "SebPortal.Api.dll"]