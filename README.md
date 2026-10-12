<img width="512" height="512" alt="unnamed" src="https://github.com/user-attachments/assets/97027142-af0d-42e9-8d44-4194a38a156d" />

# SEB Företagsbetalningar

En betalningsportal för SEB:s företagskunder (SME). Företag kan skapa betalningar
från sina konton, och betalningarna måste attesteras av behöriga personer innan
de genomförs. Allt som händer loggas i en granskningslogg.

Projektet är en ombyggnad (v2) av ett äldre Razor Pages-system till ett modernt
REST-API med separat React-frontend.

## Funktioner

- **Betalningar**: en initiator skapar betalningar från företagets konton.
  Saldot reserveras direkt, och idempotensnycklar förhindrar dubbla betalningar
  vid omförsök.
- **Attestflöde i flera steg**: beloppsgränser per företag styr hur många
  attesteringar en betalning kräver. Den som skapat betalningen kan aldrig
  attestera den själv.
- **Granskningslogg**: varje betalning, attestering och administrativ ändring
  loggas med vem, vad och när. Loggen kan filtreras och exporteras.
- **Notifieringar**: attestanter meddelas via e-post och i appen, får automatiska
  påminnelser om väntande attesteringar, och misslyckade utskick görs om.
- **Multi-tenant**: flera företag delar systemet, men varje företag ser bara
  sina egna användare, konton och betalningar.
- **Roller**: Admin, Initiator och Attestant, med olika behörigheter.
- **Säker inloggning**: JWT med refresh tokens, och lösenord hashas med BCrypt.

## Teknisk stack

| Del       | Teknik                                    |
|-----------|-------------------------------------------|
| Backend   | ASP.NET Core 8 Web API, EF Core 8         |
| Databas   | PostgreSQL                                |
| Frontend  | React 18, TypeScript, Vite, TanStack Query/Router |
| Native    | C-moduler för CSV-parsning, IBAN och audit |
| Drift     | Docker Compose                            |
| API-dokumentation | Scalar / OpenAPI (`/scalar/v1`)   |
