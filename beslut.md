# Beslutslogg — SEB Företagsbetalningar v2

Här samlas de viktigaste tekniska besluten vi tog när v1 (Razor Pages-monoliten)
byggdes om till ett REST-API med separat React-frontend. Varje beslut beskriver
problemet, vad vi valde, varför, och vad det kostar.

Datum är när ändringen mergades till `develop`. PR-numren pekar på
GitHub-historiken.

Bakgrund: [v1-arkitektur](architecture.md) · [kända buggar i v1](known-bugs.md) ·
[mål för v2](v2-targets.md)

## Översikt

| #   | Beslut                                                    | Område      | Status   |
| --- | --------------------------------------------------------- | ----------- | -------- |
| 1   | Separat Web API och React-frontend i stället för Razor Pages | Arkitektur  | Infört   |
| 2   | Lagerstruktur Controller → Service → Repository           | Arkitektur  | Infört   |
| 3   | EF Core 8 med migrationer i stället för ADO.NET           | Data        | Infört   |
| 4   | Multi-tenant via `TenantId` på varje fråga                | Säkerhet    | Infört   |
| 5   | Publika GUID-id:n utåt, interna heltals-id:n i databasen  | API         | Infört   |
| 6   | JWT + refresh tokens med rotation                         | Säkerhet    | Infört   |
| 7   | BCrypt för lösenord                                       | Säkerhet    | Infört   |
| 8   | Rollbaserad behörighet med `[Authorize(Roles = ...)]`     | Säkerhet    | Infört   |
| 9   | Saldot reserveras direkt när betalningen skapas           | Betalningar | Infört   |
| 10  | Attestgränser per tenant i databasen                      | Betalningar | Infört   |
| 11  | Idempotensnyckel på betalningsskapande                    | Betalningar | Infört   |
| 12  | Ingen optimistisk låsning (`rowversion`)                  | Betalningar | Avstått  |
| 13  | Databasen är granskningsloggens källa, signerad kopia i C | Audit       | Infört   |
| 14  | Notifieringar via kö i bakgrunden med retry               | Notiser     | Infört   |
| 15  | E-post via MailKit                                        | Notiser     | Infört   |
| 16  | Native C-moduler via P/Invoke                             | Native      | Infört   |
| 17  | Central felhantering med `IExceptionHandler`              | API         | Infört   |
| 18  | Frontend byggs och serveras i samma container som API:t   | Drift       | Infört   |
| 19  | Hemligheter utanför källkoden                             | Drift       | Infört   |
| 20  | Automatisk städning av utgångna tokens och nycklar        | Drift       | Infört   |
| 21  | Razor Pages behålls som referens under projektet          | Process     | Tillfälligt |
| 22  | Seed-data i drift fram till demon                         | Process     | Tillfälligt |
| 23  | Klientrouting och AuthContext med skyddade rutter		  | Frontend    | Infört   | 

---

## Arkitektur

### 1. Separat Web API och React-frontend

**Problem:** v1 var en Razor Pages-monolit där varje PageModel innehöll SQL,
affärslogik, e-postutskick och loggning. Koden gick inte att testa och var svår
att ändra.

**Beslut:** Backend blir ett ASP.NET Core 8 Web API. Frontend blir en separat
React 18-app (Vite, TypeScript, TanStack Router/Query, Zod).

**Varför:** Två team kan arbeta parallellt mot ett tydligt API-kontrakt. API:t
kan testas utan gränssnitt, och samma API kan användas av andra klienter senare.

**Konsekvenser:** Kontraktet måste hållas i synk. Zod-schemana i frontend
validerar svaren, så när backend ändrar en typ märks det direkt (se
[zod-schema-alignment.md](zod-schema-alignment.md)).

### 2. Lagerstruktur Controller → Service → Repository

**Beslut:** Controllers hanterar bara HTTP och behörighet. Services innehåller
affärslogiken. Repositories pratar med databasen via `SebDbContext`. Allt
registreras med dependency injection i `Program.cs`.

**Varför:** Varje lager har ett ansvar och kan testas för sig. Services kan
testas med mockade repositories.

**Konsekvenser:** Fler filer och interfaces. Några services (t.ex.
`CreatePaymentService`, `ApprovalService`) använder `SebDbContext` direkt för
att kunna köra flera steg i samma transaktion.

---

## Data

### 3. EF Core 8 med migrationer

**Problem:** v1 använde rå ADO.NET med SQL-strängar som byggdes ihop av
användarindata (SQL-injektion, BUG-001). Schemat fanns bara i `seed.sql`.

**Beslut:** Entity Framework Core 8 med Npgsql. Schemat ändras bara via
migrationer i `backend/SebPortal/Migrations`. Migrationerna körs automatiskt
när appen startar.

**Varför:** Parametriserade frågor som standard tar bort SQL-injektion.
Migrationerna ger versionshanterad schemahistorik som är likadan lokalt och i
drift.

**Konsekvenser:** Migrationer vid uppstart är enkelt men kräver att bara en
instans startar åt gången. Det räcker för vår driftmiljö.

### 4. Multi-tenant via `TenantId` (PR #76 2026-10-06)

**Beslut:** Alla tabeller som tillhör ett företag har `TenantId`. Tenant
hämtas från JWT:n och skickas med i varje repository-anrop.

**Varför:** En gemensam databas är enklare att drifta än en databas per kund.
Att filtrera explicit i varje fråga gör det tydligt i koden var avgränsningen
sker.

**Konsekvenser:** Glömmer man filtret läcker data mellan företag. Därför finns
integrationstester per resurs (`CrossTenant*IntegrationTests`) som kontrollerar
att en användare inte kan se eller ändra ett annat företags data. Även Admin
har bara behörighet inom sin egen tenant.

### 5. Publika GUID-id:n utåt (PR #87, 2026-10-08)

**Problem:** API:t exponerade databasens löpnummer. Den som såg `/payments/41`
kunde gissa att `/payments/42` fanns, vilket gör IDOR-attacker enklare.

**Beslut:** Entiteter som exponeras i API:t fick en `PublicId` (GUID).
Databasen använder fortsatt heltal internt för relationer och index.

**Varför:** GUID:er går inte att gissa. Interna heltal ger fortfarande små och
snabba index och främmande nycklar.

**Konsekvenser:** Ett brytande kontraktsbyte för frontend, där id:n gick från
tal till strängar. Granskningsloggens id:n är fortfarande numeriska.

---

## Säkerhet

### 6. JWT med refresh tokens och rotation (PR #43, #110)

**Problem:** v1 använde sessionscookies utan Secure-flagga.

**Beslut:** Stateless JWT-accesstoken (15 min) och refresh-token (7 dagar).
Refresh-token roteras vid varje användning: den gamla spärras atomärt och en
ny skapas. Bara en hash av refresh-token sparas i databasen.

**Varför:** Kort livslängd på accesstoken begränsar skadan om den läcker.
Rotation gör att en stulen refresh-token bara kan användas en gång. Hashning
gör att en databasläcka inte ger giltiga tokens.

**Konsekvenser:** En accesstoken kan inte återkallas innan den går ut, så
spärrade användare har kvar åtkomst i upp till 15 minuter.

### 7. BCrypt för lösenord (PR #13 2026-09-02)

**Problem:** v1 hashade lösenord med MD5 (BUG-002).

**Beslut:** `BCrypt.Net-Next`.

**Varför:** BCrypt är långsamt med flit och saltar automatiskt. Det är väl
beprövat och enkelt att använda i .NET.

### 8. Rollbaserad behörighet (PR #35 2026-09-17)

**Problem:** v1 jämförde roller som strängar (`== "attestant"`) i varje sida.

**Beslut:** Rollerna ligger som claims i JWT:n och kontrolleras med
`[Authorize(Roles = ...)]`. Rollnamnen finns som konstanter i `UserRoles`.

**Varför:** Behörigheten syns direkt på controllern och kontrolleras av
ramverket innan koden körs.

---

## Betalningar och attest

### 9. Saldot reserveras direkt

**Problem:** I v1 drogs saldot aldrig för direktbetalningar (BUG-009).

**Beslut:** Saldot dras när betalningen skapas, även om den väntar på attest.
Avdraget görs med ett villkorat `UPDATE ... WHERE balance >= amount` i samma
transaktion som betalningen, attestegen och granskningsposten. Nekas
betalningen förs pengarna tillbaka.

**Varför:** Det villkorade avdraget gör att två samtidiga betalningar inte kan
övertrassera kontot. Allt eller inget sparas.

**Konsekvenser:** Pengar är låsta medan betalningen väntar på attest.

### 10. Attestgränser per tenant (PR #33 2026-09-16, PR #17 2026-09-07)

**Problem:** I v1 var gränserna hårdkodade, och två sidor använde olika
gränser (BUG-006).

**Beslut:** Gränserna ligger i tabellen `ApprovalLimits` och kan ändras av
företagets Admin. `ApprovalEngineService` är det enda stället som räknar ut
hur många attester en betalning kräver.

**Varför:** Varje företag har egna regler, och logiken finns bara på ett
ställe.

**Konsekvenser och regler:**

- Skaparen räknas aldrig som attestant, inte ens om det är en Admin.
- Vid flera attester måste attestanterna vara olika personer. Finns det för
  få attestanter går betalningen inte att skapa.
- Ett nej avslår hela betalningen.
- Stegen behöver inte godkännas i ordning.

### 11. Idempotensnyckel på betalningsskapande (PR #24, 2026-09-10)

**Problem:** Om nätet hackar och klienten skickar om samma betalning skapas
den två gånger.

**Beslut:** `POST` för betalningar kräver headern `X-Idempotency-Key`.
`IdempotencyFilter` sparar nyckeln (prefixad med tenant) och en SHA-256-hash av
begäran. Samma nyckel och samma innehåll ger tillbaka det sparade svaret. Samma
nyckel med annat innehåll ger `409 Conflict`.

**Varför:** Ett filter håller logiken utanför controllern och kan återanvändas.
Hashen fångar klientbuggar där en nyckel återanvänds för en annan betalning.

**Konsekvenser:** Frontend måste skapa en ny nyckel per betalningsförsök och
återanvända den vid omförsök. Nycklarna gäller i en minut och städas sedan bort.

### 12. Ingen optimistisk låsning (`rowversion`)

**Bakgrund:** [v2-targets.md](v2-targets.md) föreslår `rowversion`/`xmin` för
att förhindra dubbla godkännanden.

**Beslut:** Vi har medvetet inte infört det.

**Varför:** Dubbla beslut på samma atteststeg stoppas redan genom att uppdateringen bara lyckas om steget fortfarande är
`pending`, och saldot skyddas av det villkorade avdraget i beslut 9.

---

## Granskningslogg

### 13. Databasen är källan, signerad kopia i C (PR #22, #67, #73, #102)

**Problem:** v1 loggade ibland till databasen, ibland till `/tmp/audit.log`,
ibland till båda (BUG-008). UI:t visade bara hälften.

**Beslut:** Alla händelser skrivs till tabellen `AuditEntries` i samma
transaktion som ändringen de beskriver. `AuditNativeBackgroundService` läser
sedan nya poster och lägger till dem i en append-only-fil via C-modulen
`libauditsigner`, där varje post signeras med HMAC-SHA256 och kedjas till
föregående post.

**Varför:** Databasen gör loggen sökbar, filtrerbar per tenant och exporterbar.
Den signerade kedjan gör det möjligt att upptäcka om någon ändrat i historiken.
Att signera i bakgrunden gör att en betalning inte misslyckas för att
signeringen strular.

**Konsekvenser:** Signeringen ligger en kort stund efter databasen. Om
verifieringen av kedjan misslyckas stoppar tjänsten och loggar ett kritiskt
fel, i stället för att fortsätta skriva på en trasig kedja.

---

## Notifieringar

### 14. Kö i bakgrunden med retry (PR #48, #86, #103, #115)

**Problem:** I v1 skickades e-post direkt i sidan och alla fel sväljdes
(BUG-007).

**Beslut:** Notiser läggs på en `Channel<T>`-kö och skickas av
`NotificationBackgroundService`. Polly gör upp till 3 försök med exponentiell
backoff. Misslyckade utskick sparas i `NotificationLog`. Attestanter får även
notiser i appen och påminnelser om väntande attester (`ReminderBackgroundService`).

**Varför:** API-anropet behöver inte vänta på e-postservern. Fel syns i
databasen i stället för att försvinna.

**Konsekvenser:** Kön ligger i minnet. Startas appen om försvinner notiser som
inte hunnit skickas. Vi valde det framför Hangfire eller en extern kö för att
hålla driften enkel.

### 15. MailKit i stället för `SmtpClient` (PR #48 2026-09-22, #115 2026-10-20)

**Beslut:** E-post skickas via `MailKit` bakom interfacet `IEmailSender`.

**Varför:** Microsoft rekommenderar inte längre `SmtpClient`. Interfacet gör
att e-post kan mockas i tester.

---

## Native-moduler

### 16. C-moduler via P/Invoke (PR #22, #59, #60, #75, #77)

**Beslut:** Tre moduler i `native/` byggs till delade bibliotek. CSV-parsern och
audit-signeringen anropas från .NET med `DllImport`:

- `libcsvparser` — RFC 4180-kompatibel CSV-parsning för batchbetalningar
  (ersätter `string.Split(',')`, BUG-004)
- `libiban` — IBAN-validering med MOD97 (BUG-003). Byggs och testas, men
  anropas ännu inte från API:t. Nya konton får IBAN med korrekt kontrollsiffra
  via `GenerateIbanService` i C#.
- `libauditsigner` — signerad granskningslogg (se beslut 13)

**Varför:** Det var en del av uppdraget. Modulerna är små och kan testas för
sig med cmocka.

**Konsekvenser:** Biblioteken måste byggas för Linux, så de byggs i
Dockerfilen och i CI. Lokalt på Windows körs appen därför via Docker.

---

## API och felhantering

### 17. Central felhantering (PR #31, 2026-09-14)

**Beslut:** `GlobalExceptionHandler` översätter exceptions till statuskoder
och `ProblemDetails`. Controllers har ingen try/catch. Egna exceptions
(`BusinessRuleException`, `NotFoundException`, `ServiceUnavailableException`)
används för förväntade fel.

**Varför:** Samma felformat överallt, och felhanteringen finns på ett ställe.
Stacktraces visas aldrig för klienten.

---

## Drift

### 18. Frontend i samma container som API:t (PR #89)

**Beslut:** Dockerfilen har ett Node-steg som bygger frontend. Resultatet
kopieras till `wwwroot` och serveras av API:t. Okända `/api/*`-rutter ger 404,
övriga rutter ger `index.html`.

**Varför:** Driftplattformen ger bara tjänsten `app` en publik adress
(se [DRIFT.md](../DRIFT.md)). Samma ursprung för frontend och API gör också
att CORS inte behövs i drift.

Mer detaljer: [docker-frontend-integration.md](docker-frontend-integration.md).

### 19. Hemligheter utanför källkoden (PR #23, #97)

**Beslut:** Anslutningssträng, JWT-nyckel och audit-nyckel läses från
miljövariabler (`infra/.env`, som inte checkas in) eller User Secrets lokalt.
Appen startar inte om JWT-inställningarna saknas.

**Varför:** v1 hade lösenord hårdkodade på flera ställen. Att appen vägrar
starta gör att en felkonfiguration upptäcks direkt.

**Senare:** I en riktig produktionsmiljö skulle hemligheterna flyttas till
t.ex. Azure Key Vault.

### 20. Automatisk städning (PR #114, 2026-10-20)

**Beslut:** `ExpireDateCleanupService` tar bort utgångna refresh tokens och
idempotensnycklar en gång i timmen. Index lades till på utgångsdatumen.

**Varför:** Tabellerna växer annars obegränsat.

---

### 22. Seed-data i drift fram till demon

**Beslut:** `infra/seed.sql` med demoanvändare körs även i drift så att
systemet kan visas på demon. All seed-data och konfigurationen `Seed__Path`
tas bort efter demon.

---

## Frontend

### 23. Klientrouting och AuthContext med skyddade rutter (PR #6, 2026-08-31)

**Problem:** När v1 (Razor Pages) ersattes med ett separat React-SPA behövdes ett säkert sätt att hantera användarens inloggningsstatus i klienten och förhindra oinloggade från att nå skyddade vyer.

**Beslut:** Implementera TanStack Router tillsammans med en central `AuthContext` som hanterar JWT-tokens, användarstatus och automatiska omdirigeringar vid saknad behörighet.

**Varför:** Skapar en sömlös användarupplevelse utan omladdningar och säkerställer att skyddade klientrutter valideras direkt i gränssnittet innan anrop skickas till API:t.

**Konsekvenser:** Tillståndet i `AuthContext` måste alltid hållas i synk med backendens token-giltighet och refresh-flöde.

---

## Lägga till ett beslut

Kopiera mallen, ge beslutet nästa nummer och lägg till en rad i översikten.

```markdown
### N. Kort rubrik (PR #, datum)

**Problem:** Vad var fel eller saknades?

**Beslut:** Vad valde vi?

**Varför:** Varför detta och inte alternativen?

**Konsekvenser:** Vad kostar det, och vad måste andra känna till?
```
