# Hub San Paolo - Features Specification

## 1. Authentication (Login)
- **Goal**: Secure entry to the Hub portal.
- **Workflow**:
  - The login screen must validate credentials against Firebase Auth or mocked database data.
  - Form must utilize reusable Atoms (`Input`, `Button`).
  - Errors must display cleanly.
  - On success, redirect to `/hub`.

## 2. Dynamic Sector Hub
- **Goal**: Display grid of available sectors.
- **Rules**:
  - Grid should be populated mapped from `sectorsData.ts`.
  - Grid cards must be responsive (`Grid` -> `SectorCard`).
  - Each sector routes to `/setor/:id`.
  - Sectors require unique icons using Phosphor Icons.
  - Maintain the distinct styling applied to "Diretoria" (Brand Orange).

## 3. User Management (Admin)
- **Goal**: Allow Admin accounts to manage user permissions.
- **Rules**:
  - Must display only if user role === 'admin'.
  - Uses `AdminModal` organism.
  - Form allows adding users, searching current users.

## 4. Shared Technical Needs
- **TDD Requirement**: Logic must be drafted with unit tests first.
- **Lines of Code constraint**: File limits < 300 LOC.
- **Styling**: Tailwind utility-first application.
