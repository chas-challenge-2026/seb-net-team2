# Frontend i Docker

## Bakgrund

`infra/docker-compose.yml` använder `backend/SebPortal/Dockerfile`, som tidigare
bara byggde backend. React-appen byggdes därför inte och fanns inte i containern.
Enligt `DRIFT.md` ska frontend byggas och serveras tillsammans med backend.

## Ändringar

### `backend/SebPortal/Dockerfile`

- Ett nytt byggsteg använder `node:24-bookworm-slim`.
- `package.json` och `package-lock.json` kopieras först, följt av `npm ci`.
  Docker kan då återanvända beroendesteget när bara källkoden ändras.
- Frontendens källkod kopieras och byggs med `npm run build`, vilket kör
  TypeScript-kontroll och Vite.
- `frontend/dist` kopieras från byggsteget till `/app/wwwroot` i runtime-imagen.
- .NET och native-biblioteken byggs som tidigare. Node behövs bara vid bygget.

### `backend/SebPortal/Program.cs`

- `UseDefaultFiles()` före `UseStaticFiles()` gör att `/` visar `index.html`.
- `MapFallbackToFile("index.html")` gör att React-rutter fungerar när användaren
  öppnar en direktlänk eller laddar om sidan.
- En separat fallback för `/api/{**path}` ger 404 för okända API-rutter,
  så att API-anrop inte får HTML från React-appen som svar.
- Controller-endpoints används fortfarande för befintliga API-rutter.

### Frontendens API-adress

Följande filer använder nu `VITE_API_URL || window.location.origin`:

- `frontend/src/services/accountService.ts`
- `frontend/src/services/approvalLimitsService.ts`
- `frontend/src/services/approvalService.ts`
- `frontend/src/services/auditService.ts`
- `frontend/src/services/authService.ts`

Om `VITE_API_URL` saknas eller är tom används sidans protokoll, värd och port.
I Docker går frontend och API därför via samma adress, både lokalt och vid deploy.
Lokal utveckling med separat Vite-server kan fortsatt använda
`VITE_API_URL=http://localhost:8081` i `frontend/.env`.
Vite läser värdet vid frontendbygget; ett runtime-värde i Compose ändrar inte den
redan byggda JavaScript-koden.

### `.dockerignore`

Git-metadata, `node_modules`, `dist`, .NET-byggmappar, lokala `.env`-filer och
kompilerade native-filer utesluts ur byggkontexten. Exempel på miljöfiler tillåts.
Det hindrar lokala beroenden och frontendens lokala miljöinställningar från att
kopieras in i Dockerbygget. Native-filer byggs inne i Docker.

## Starta lokalt

Starta Docker Desktop och säkerställ att `infra/.env` är konfigurerad enligt
`infra/.env.example`. Kör från repots rot:

```sh
cd infra
docker compose up --build
```

Öppna <http://localhost:8081>. Frontend och API serveras av tjänsten `app`.
Compose-filerna behöver inte ändras: byggkontexten är redan repots rot och
den lokala override-filen publicerar port 8081.

Vid separat frontendutveckling används fortfarande `npm run dev` i `frontend`
med en konfigurerad `VITE_API_URL`.

## Reparation av låsfil

Det första fullständiga Dockerbygget stoppade vid `npm ci`. Den befintliga
`frontend/package-lock.json` innehöll ett ofullständigt block för
`@babel/core/node_modules/@babel/types` och var ogiltig JSON.
Blocket stängdes och låsfilen synkroniserades med
`npm install --package-lock-only --ignore-scripts --no-audit --no-fund`.
Det gav en större ändring i den genererade låsfilen; `package.json` ändrades inte.

## Verifiering

### Rättning av inloggning

Backend returnerar UUID-strängar i `login.userId` och `currentUser.id`, men
frontendens Zod-scheman förväntade sig tal. Det gav ett valideringsfel efter
lyckad autentisering och gränssnittet visade "Something went wrong".
`loginResponseSchema.userId` och `currentUserSchema.id` använder nu
`z.string().uuid()`. Mock-användarens ID har också uppdaterats till en UUID-sträng.
Inloggning och `/api/auth/me` har anropats mot det körande API:t och båda svaren
klarar de uppdaterade frontend-schemana. Frontendbygget lyckas.

Utfört:

- `npm run build`: godkänt.
- `npm run build` med tom `VITE_API_URL` och `VITE_MOCK_AUTH=false`: godkänt.
- `docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml config --quiet`:
  godkänt. Compose varnar för det befintliga, föråldrade `version`-fältet.
- `git diff --check`: godkänt.

Vite varnar för en JavaScript-bundle över 500 kB. Bygget lyckas ändå.

Uppföljande verifiering efter reparation av låsfilen:

- `docker compose --progress plain -f infra/docker-compose.yml -f infra/docker-compose.override.yml build app`:
  godkänt. `npm ci`, frontendbygget, native-bygget och `dotnet publish` lyckades.
  Imagen `seb-app:latest` skapades med frontend i `wwwroot`.

Begränsningar:

- Uppstart av tjänsterna och verifiering i webbläsaren har inte utförts.
- `dotnet build backend/SebPortal/SebPortal.Api.csproj --no-restore` stoppas
  lokalt av att `native/libcsvparser.so` saknas. Dockerfilen bygger biblioteket
  med `make -C native` innan .NET publiceras.

Efter start, kontrollera att startsidan visas, att en React-rutt går att ladda om,
att inloggning når API:t och att en okänd `/api/`-adress ger 404.
