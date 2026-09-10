# syntax=docker/dockerfile:1

# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: build the ASP.NET Core backend ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
# Restore first so the NuGet layer is cached between source edits.
COPY backend/BtsAssetMgmt.Core/BtsAssetMgmt.Core.csproj BtsAssetMgmt.Core/
COPY backend/BtsAssetMgmt.Infrastructure/BtsAssetMgmt.Infrastructure.csproj BtsAssetMgmt.Infrastructure/
COPY backend/BtsAssetMgmt.Api/BtsAssetMgmt.Api.csproj BtsAssetMgmt.Api/
RUN dotnet restore BtsAssetMgmt.Api/BtsAssetMgmt.Api.csproj
COPY backend/BtsAssetMgmt.Core/ BtsAssetMgmt.Core/
COPY backend/BtsAssetMgmt.Infrastructure/ BtsAssetMgmt.Infrastructure/
COPY backend/BtsAssetMgmt.Api/ BtsAssetMgmt.Api/
RUN dotnet publish BtsAssetMgmt.Api/BtsAssetMgmt.Api.csproj -c Release -o /app/publish --no-restore

# ---------- Stage 3: runtime image ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# .NET 8+ images listen on 8080 by default; make it explicit and expose the same port.
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__DefaultConnection="Data Source=/app/data/bts.db"
EXPOSE 8080

COPY --from=backend-build /app/publish .
COPY --from=frontend-build /src/frontend/dist ./wwwroot

# SQLite database and backups live here; mount a volume on /app/data to persist them.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENTRYPOINT ["dotnet", "BtsAssetMgmt.Api.dll"]
