# Local Configuration and Secrets (Developer Guide)

This document explains how to handle secrets and environment configuration locally without committing sensitive data to source control.

---

## 1. Running via Docker (`docker compose`)

Docker Compose reads configuration and environment variables from a local `.env` file located in the `infra/` directory. **Never check in `.env` to Git.**

### Setup:
1. Navigate to the `infra/` folder.
2. Create a `.env` file by copying the template file `.env.example`:
   ```bash
   cp .env.example .env
 