# Frontend

The frontend is a React and TypeScript app built with Vite. It provides the payment portal UI and calls the ASP.NET Core API.

## Requirements

- Node.js and npm
- Docker, if you also need to run the backend and database locally

## Run locally

From this directory, install the dependencies and start Vite:

```bash
npm ci
npm run dev
```

Vite prints the local URL when it starts, usually `http://localhost:5173`.

The frontend needs the API URL in `.env.development`. Copy `.env.example` to `.env.development` or create the file with:

```env
VITE_API_URL=http://localhost:8081
```

Start the API and database separately from the repository's `infra` directory:

```bash
docker compose up --build
```

If you change an environment file while Vite is running, restart the dev server so it picks up the change.

The app uses the API for login and protected requests. For local development, `VITE_MOCK_AUTH=true` enables a mock admin session; leave it unset or set it to `false` to use the real login flow.

## Useful commands

```bash
npm run dev      # Start the development server
npm run build    # Type-check and create a production build
npm run preview  # Serve the production build locally
npm run lint     # Run ESLint
```

The production build is written to `dist/`.
