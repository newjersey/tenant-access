# Tenant Access

A tenant access application for the New Jersey Innovation Authority. This application provides secure access management and interfaces for tenants.

## Table of Contents

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Testing](#testing)
5. [Code Quality](#code-quality)
6. [License](#license)
7. [Disclaimer](#disclaimer)

## Architecture

This is a modern React application built with Vite and TypeScript, organized as an npm workspace monorepo. The project emphasizes type safety, testing, and code quality through automated tooling.

### Built With

- [React 19](https://react.dev/) - UI library
- [React Router 7](https://reactrouter.com/) - Client-side routing
- [TypeScript 7](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite 8](https://vite.dev/) - Build tool and dev server
- [Vitest 4](https://vitest.dev/) - Unit testing framework
- [Testing Library](https://testing-library.com/) - Component testing utilities
- [Biome](https://biomejs.dev/) - Linting and formatting
- [Husky](https://typicode.github.io/husky/) - Git hooks

### Project Structure

```
tenant-access/
├── app/              # Frontend application workspace (React + Vite)
│   ├── src/          # Application source code
│   ├── public/       # Static assets
│   └── package.json  # App-specific dependencies
├── api/              # Backend workspace (AWS Lambda, TypeScript)
│   ├── src/          # Lambda handler source code
│   └── package.json  # API-specific dependencies
├── .github/          # GitHub workflows and templates
├── .husky/           # Git hooks
└── package.json      # Root workspace configuration
```

The `api` workspace is a minimal skeleton for the planned backend: a Lambda
that communicates with a PostgreSQL database. It is configured for a Node
runtime (its own `tsconfig.json`, separate from the frontend) with a
placeholder handler. Build tooling, database client, and deployment are not
yet chosen. Build/typecheck it with `npm run build:api`.

## Installation

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm (comes with Node.js)

### Setup

```bash
# Clone this repository
git clone https://github.com/newjersey/tenant-access

# Go into the repository
cd tenant-access

# Install dependencies
npm install
```

### Adding Dependencies

This is an npm workspace monorepo: the root `package.json` owns the workspace configuration and the single `package-lock.json`, and dependencies are hoisted to the root `node_modules`. **Always install from the repository root**, targeting the `app` workspace:

```bash
# Runtime dependency for the app
npm install <package> --workspace=app

# Dev-only dependency for the app
npm install --save-dev <package> --workspace=app
```

Commit the updated `app/package.json` and the root `package-lock.json` together in the same change. CI runs `npm ci`, which installs strictly from the committed lockfile and fails if it is out of sync with `package.json`.

## Usage

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:

```bash
npm run build
```

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Testing

### Run Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Code Quality

### Linting and Formatting

```bash
# Check formatting
npm run format:check

# Fix formatting issues
npm run format

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run both checks and fixes
npm run check:fix
```

Git hooks are configured via Husky to automatically run code quality checks on commit.

### Development Principles

- Test-driven development (TDD)
- YAGNI - build only what's needed now
- Accessibility (WCAG 2.2 AA compliance)
- Simple, maintainable solutions over clever complexity

## License

This project is licensed under the MIT license. For more information, see [LICENSE](LICENSE).

## Disclaimer

This project utilizes certain tools and technologies for development purposes. The inclusion of these tools does not imply endorsement or recommendation. Users are encouraged to evaluate the suitability of these tools for their own use.
