# Hub San Paolo - Features Specification

## 1. Authentication (Login)
- **Goal**: Secure entry to the Hub portal.
- **Workflow**:
  - The login screen must validate credentials against Firebase Auth or mocked database data.
  - Form must utilize reusable Atoms (`Input`, `Button`).
  - Errors must display cleanly.
  - On success, redirect to `/hub`.

## 2. Sector Hub (Auditoria Exclusivo)
- **Goal**: Direct access or hub routing for Auditoria sector.
- **Rules**:
  - Grid is populated from `appConfig.sectors` containing Auditoria.
  - Cards are responsive (`SectorCard`).
  - Seamless redirection directly to `/setores/Auditoria/index.html`.

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
