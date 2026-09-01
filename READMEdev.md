# Local configuration and secrets (developer)

This file explains how we keep secrets out of source control and how new developers set up their local environment.

## Use `dotnet user-secrets` (local)
1. Open a terminal in the backend project folder (the folder that contains the `.csproj`, e.g. `backend/SebPortal`).
2. Initialize user-secrets (needed only once per project):

```bash
dotnet user-secrets init
```

3. Set required secrets:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=seb;Username=seb;Password=your_local_password"

dotnet user-secrets set "Jwt:Secret" "your_min_32_char_secret_key"
```

## Legacy Razor Pages
- Legacy Razor Pages may remain in the repository until their logic has been migrated.
- Avoid adding real secrets into `.cs` files. When migration is complete, remove the legacy files and verify the repository contains no secrets.
