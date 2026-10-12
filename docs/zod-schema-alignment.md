# Zod-scheman och API-kontrakt

## Ändringar

Frontendens scheman har jämförts med backendens DTO:er. Följande fält
valideras nu som UUID-strängar med `z.string().uuid()`:

| Schema | Fält |
| --- | --- |
| `accountResponseSchema` | `id` |
| `createdPaymentSchema` | `id`, `fromAccountId` |
| `readUserSchema` | `id` |
| `approvalLimitSchema` | `id` |
| `pendingApprovalStepSchema` | `stepId`, `paymentId`, `createdByUserId` |
| `approvalDecisionSchema` | `stepId` |

`currentUserSchema.id` och `loginResponseSchema.userId` hade redan rättats
till UUID-strängar vid felsökningen av inloggningen.

Tenant-ID, belopp, antal och stegnummer är fortsatt numeriska.
Granskningsloggens ID-fält är också fortsatt numeriska enligt dess API-kontrakt.

## Kod som använder ID:n

- Tjänster för användare, attestgränser och betalningar tar emot sträng-ID:n.
- Administrationssidornas URL-parametrar konverteras inte längre till tal.
- En ny betalning skickar kontots UUID direkt. Kopplingen mellan betalning och
  konto använder samma sträng utan `Number(...)`.
- Attestkorgens kommentarer och listan över möjliga dubbletter använder sträng-ID:n.
- Användaruppdateringens svar valideras med `readUserSchema`. Schemat för
  uppdateringsbegäran tog tidigare bort svarsfält som `id`.

## Användarfilter i granskningsloggen

Användarlistan returnerar UUID medan granskningsloggen använder interna numeriska
ID:n. Dropdownens val skickas därför som `userPublicId`, en ny valfri queryparameter.
Backend filtrerar på `e.User.PublicId` inom den befintliga tenant-avgränsningen.
Det befintliga numeriska `userId`-filtret fungerar fortfarande. Ingen migration behövs.

## Verifiering

- Frontendens TypeScript-kontroll och produktionsbygge lyckas.
- Dockerbygget lyckas och appcontainern har återskapats med ändringarna.
- Fyra tester för scheman och konto-/betalningstjänster lyckas.
- Sju tester för flödet för en ny betalning lyckas, med UUID i testdatan.
- Riktiga API-svar har validerats med frontendens scheman för inloggning,
  aktuell användare, konton, egna betalningar, väntande attester, användarlistan,
  attestgränser och granskningsloggen. Testerna använde seed-konton för
  Initiator, Attestant och Admin.
- Granskningsloggens nya UUID-filter har anropats för användarna i listan.

Repots `frontend/jest.config.cjs` innehåller två ihopklistrade konfigurationer.
Testerna kördes därför med tillfälliga konfigurationer i systemets tempmapp,
baserade på filens befintliga testmiljö och transform. Den filen har inte ändrats.

Ladda om webbläsaren med Ctrl+F5 för att hämta den nya frontendbundlen.
