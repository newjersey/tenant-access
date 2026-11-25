# Tenant Access

A affordable housing application for the New Jersey Housing and Mortgage Finance Agency (NJHMFA) developed with the New Jersey Innovation Authority (NJIA). This application provides a searchable list of properties for potential tenants. Future features may include property manager and tenant accounts, and listing management.

## Table of Contents

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Infrastructure](#infrastructure)
4. [ProfileNJ Integration](#profilenj-integration)
5. [Database Migrations](#database-migrations)
6. [Usage](#usage)
7. [Testing](#testing)
8. [Code Quality](#code-quality)
9. [Monitoring](#monitoring)
10. [Analytics and Feedback](#analytics-and-feedback)
11. [License](#license)
12. [Disclaimer](#disclaimer)

## Architecture

This is a monorepo with npm, with both frontend and backend in Typescript. The frontend, in `app/`, is a React application. The backend, in `api/`, is AWS CDK-managed infrastructure.

### Built With

- [AWS CDK](https://aws.amazon.com/cdk/) - Amazon Web Services Cloud Development Kit
- [PostgreSQL](https://www.postgresql.org/) - SQL database
- [React](https://react.dev/) - UI library
- [React Router](https://reactrouter.com/) - Client-side routing
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vite.dev/) - Build tool and dev server
- [Vitest](https://vitest.dev/) - Unit testing framework
- [Testing Library](https://testing-library.com/) - Component testing utilities
- [Playwright](https://playwright.dev/) - End-to-end frontend testing
- [Biome](https://biomejs.dev/) - Linting and formatting
- [Husky](https://typicode.github.io/husky/) - Git hooks

See the package.json for the full list of dependencies and versions.

### Project Structure

```
tenant-access/
├── app/                # Frontend application workspace (React + Vite)
│   ├── src/            # Application source code
│   ├── public/         # Static assets
│   └── package.json    # App-specific dependencies
├── api/                # Backend workspace (AWS Lambda, TypeScript)
    ├── fixtures/       # Example HTML and JSON for use in backend tests
    ├── infrastructure/ # CDK
    ├── migrations/     # SQL database migrations
│   ├── src/            # Lambda handler source code
│   └── package.json    # API-specific dependencies
├── .github/            # GitHub workflows and templates
├── .husky/             # Git hooks (typecheck)
└── package.json        # Root workspace configuration
```

The `api` workspace is configured for a Node runtime (its own `tsconfig.json`, separate from the frontend).

## Installation

Securely obtain `api/.env.dev`, `api/.env.prod`, and `app/.env.local` from a teammate.

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm (comes with Node.js)

### Setup

```bash
git clone https://github.com/newjersey/tenant-access

cd tenant-access

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

### Test DB Setup

To run backend tests that depend on a Postgres DB, we need containerization [as described in the Engineering Wiki](https://newjersey.github.io/innovation-engineering/tech-recommendations/infrastructure/#containerization). GitHub Actions on ubuntu will run the equivalent with a pre-installed docker so you can skip this if you want to just rely on GitHub Actions.

If you want to also be able to run the db tests locally:

```
brew install colima docker docker-compose

# you may need to explicitly link docker compose on your local machine like in these two lines
mkdir -p ~/.docker/cli-plugins
ln -sfn "$(brew --prefix)/lib/docker/cli-plugins/docker-compose" ~/.docker/cli-plugins/docker-compose

colima start --vm-type=vz --vz-rosetta --mount-type=virtiofs

# optional: this makes colima run in background, even persisting across reboots
brew services start colima
```

If any new file imports a DB connection, it will be automatically added to the DB tests for coverage purposes. If you definitely don't need DB tests for this file, you can add it to `EXEMPT` in `vitest.db.config.ts`.

## Infrastructure

This project uses the AWS CDK to deploy its infrastructure. To make updates:

1. Edit `api/infrastructure/lib/tenant-access-stack.ts`
2. With AWS credentials for the target account in your environment, run `npm run deploy:dev` or `npm run deploy:prod` from the `api` directory.
  2a. Don't run `npx cdk deploy` directly; the script loads the matching `api/.env.dev` or `api/.env.prod` and fails if your AWS credentials are for a different account than that file expects.
  2b. Any extra arguments are passed through to `cdk deploy`.

### Temporary Data Infrastructure

This part of the infrastructure should only be running while the legacy application is still the source of truth. Once our application can serve as the source of truth, the EventBridge Scheduler, ScrapeListings Lambda, ScrapedDataBucket, and ParseListings Lambda can all be deprecated (the UpdateListings Lambda and ListingsDatabase would remain).

```mermaid
flowchart TD
    A@{ shape: stadium, label: "NightlyScrapeSchedule
    EventBridge Scheduler" }
    B@{ shape: rect, label: "ScrapeListingsFunction
    Lambda" }
    C@{ shape: lin-cyl, label: "ScrapedDataBucket
    S3 Bucket" }
    D@{ shape: rect, label: "ParseListingsFunction
    Lambda" }
    E@{ shape: rect, label: "UpdateListingsFunction
    Lambda" }
    F@{ shape: cyl, label: "ListingsDatabase
    RDS Postgres" }
    G@{ shape: docs, label: "ScrapeDetailsQueue" }
    H@{ shape: rect, label: "ScrapeDetailsFunction" }
    I@{ shape: rect, label: "UpdateDetailsFunction" }
    J@{ shape: lin-cyl, label: "ListingImagesBucket" }
    K@{ shape: sm-circ }
    L@{ shape: rect, label: "GeocodeListingFunction" }
    M@{ shape: rect, label: "UpdateGeocodesFunction" }
    N@{ shape: cloud, label: "Census Geocoder
    batch API" }

    A --> |midnight Eastern triggers| B
    B --> |writes ~14MB raw/YYYY-MM-DD/listings.html| C
    C --> |OBJECT_CREATED in raw/ triggers| K --> D
    D --> |writes ~3MB parsed/YYYY-MM-DD/listings.json| C
    C --> |OBJECT_CREATED in parsed/ triggers| E
    E --> |upserts + reconciles shown_to_public| F
    E --> |enqueues any listings needing details| G
    G --> |triggers| H
    H --> |writes details/UID.json| C
    C --> |OBJECT_CREATED in details/ triggers| I
    I --> |uploads images| J
    I --> |saves details| F
    E --> |writes geocode-requests/TIMESTAMP.json| C
    C --> |OBJECT_CREATED in geocode-requests/ triggers| L
    L --> |gets lat/lngs for addresses| N
    L --> |writes geocode/TIMESTAMP.json| C
    C --> |OBJECT_CREATED in geocode/ triggers| M
    M --> |saves lat/lng| F
```

### Application Backend

Performance considerations:
* Searches only return 20 results at a time
* Pagination and counting only go 1001 deep into results
* Lambda instances and DB connections are capped to not make our costs explode in a worst-case scenario

```mermaid
flowchart TD
  A@{ shape: sl-rect, label: "Request" }
  B@{ shape: trapezoid, label: "API Gateway"}
  C@{ shape: rounded, label: "Search Lambda"}
  D@{ shape: cyl, label: "ListingsDatabase RDS Postgres" }
  E@{ shape: rounded, label: "Photos Lambda"}
  F@{ shape: lin-cyl, label: "ListingImagesBucket" }
  G@{ shape: rounded, label: "Auth Lambda" }
  H@{ shape: hexagon, label: "ProfileNJ" }

  A --> B
  B --> |within rate limit| C
  C --> |queries| D
  B --> |within rate limit| E
  E --> |queries| F
  B --> |within rate limit| G
  G --> |interacts with| H
```

### Endpoints

<details>
<summary><code>/listings/search?page=3&location=newark</code></summary>

Returns JSON of max-20 listings, plus the total count (max 1001) of listings that meet search criteria.

Increment `page` to get later pages of results. Any number above 50 reverts to 50.

Change `location` (ONLY searches by city name right now), or make it blank to return all locationss
</details>

<details>
<summary><code>/photos/{listing_uid}/{image_id}.jpg</code></summary>

Returns image from S3 bucket
</details>

<details>
<summary><code>/auth/*</code></summary>

All the following endpoints are handled by the Auth Lambda.

* `/auth/login`: Forwards user to ProfileNJ to Register or Login. See [below](#login) for underlying flow.

* `/auth/callback`: Forwarded here from ProfileNJ on successful login. See [below](#login) for underlying flow.

* `/auth/logout`: Forwards user to ProfileNJ to Logout. See [below](#logout) for underlying flow.

* `/auth/session`: Returns whether signed in, and any other data from cookie. See [below](#session) for underlying flow.
</details>

### Frontend Hosting

The React app in `app/` is hosted by AWS Amplify, which is **not** managed by the CDK stack in
this repo. Each AWS account has its own Amplify app connected to this GitHub repository,
watching a single branch:

| Branch | AWS account |
| --- | --- |
| `dev` | Dev |
| `main` | Prod |

Pushing to one of those branches triggers an Amplify build automatically through a [webhook](https://github.com/newjersey/tenant-access/settings/hooks) (not a GitHub Action). To change any configuration, use the Amplify console in the relevant account.

`amplify.yml` in the repository root is the build spec Amplify reads. It builds the frontend only (`app/dist`).

Both environments are currently password-protected because the application is not ready for launch. The Prod restriction should be removed at launch; Dev can keep it indefinitely. The username and password are available in `Project Info` in the `#tenant-access` Innovation Slack channel.

<strong>Environment Variables set on Amplify</strong>

Each has one value for Production and a separate value for Development:

* `VITE_API_BASE_URL`
* `VITE_GA_MEASUREMENT_ID`
* `VITE_AUTH_BASE_URL`

## ProfileNJ integration

Our dev and prod integrations both need to register with ProfileNJ, supplying host and callback info as well as the account scopes that we will ask the users to fill out and the app to then get back in the `session` cookie.

### Keys and Secrets

Set once per environment:

* `OIDC_ISSUER` - issued by ProfileNJ when we register our dev/prod logins with them. set in the `.env` file when CDK deployed. Used by Auth Lambda to contact ProfileNJ.
* `OIDC_CLIENT_ID` - issued by ProfileNJ when we register our dev/prod logins with them. set in the `.env` file when CDK deployed. Used by Auth Lambda to contact ProfileNJ.
* `OIDC_REDIRECT_URI` - we give this to ProfileNJ when we first register the dev/prod login. Our Auth Lambda submits it again along with each request, and ProfileNJ checks against what we originally said.
* `sessionSecret` - Generated once by `generateStringKey` in CDK code and stored in AWS Secrets Manager. used by Auth Lambda to sign and check `session` cookie data to make sure it doesn't change.
* `clientSecret` - Issued by ProfileNJ when we register our dev/prod logins with them. Stored manually in AWS Secrets Manager. Sent by Auth Lambda to ProfileNJ to verify request comes from us.

Generated on each register/login request (`openid-client` helps check these):

* PKCE (`code_verifier` and `code_challenge`) - Proof Key for Code Exchange. Proves to ProfileNJ that our identity doesn't change through the various steps. [OAuth docs](https://oauth.net/2/pkce/)
* `state` - This is a simple plaintext value that comes back to us in the callback. "Is this the incoming login response I actually requested?" [Auth0 article](https://auth0.com/blog/demystifying-oauth-security-state-vs-nonce-vs-pkce/#The-State-Parameter--Preventing-OAuth-CSRF)
* `nonce` - "number used once". Comes back from ProfileNJ and checked to match. "Is this ID token I just received actually for the login I just initiated?" [Auth0 article](https://auth0.com/blog/demystifying-oauth-security-state-vs-nonce-vs-pkce/#The-Nonce-Parameter--Preventing-ID-Token-Replay)

### Session

Once logged in, the app keeps a `session` cookie for 8 hours. This can be seen in the browser's Inspector, and the contents are signed (though not encrypted; users can get info out manually). It is set to `HttpOnly`, so the React code can't see it even though the user can. In order to check for its existence and get info out of it, the frontend calls `auth/session` on the backend.

User is signed in:

```mermaid
sequenceDiagram
    autonumber
    participant Nav as AccountNav<br/>(React header)
    participant B as Browser
    participant A as Auth Lambda<br/>api.../auth/session

    Note over Nav: renders nothing yet
    Nav->>B: fetch /auth/session, credentials include
    Note over B: attaches the session cookie for api.dev<br/>(page JS never sees it)
    B->>A: GET /auth/session<br/>Cookie session=payload.signature
    Note over A: signature matches sessionSecret<br/>expiresAt is in the future
    A-->>B: 200 signedIn true, email<br/>+ CORS headers for dev origin
    B-->>Nav: signedIn true, email
    Note over Nav: shows email and "Log out"
```

User is signed out:

```mermaid
sequenceDiagram
    autonumber
    participant Nav as AccountNav<br/>(React header)
    participant B as Browser
    participant A as Auth Lambda<br/>api.../auth/session

    Note over Nav: renders nothing yet
    Nav->>B: fetch /auth/session, credentials include
    Note over B: attaches a session cookie only if it has one
    B->>A: GET /auth/session
    Note over A: no cookie, signature does not match,<br/>or expiresAt has passed
    A-->>B: 200 signedIn false<br/>+ CORS headers for dev origin
    B-->>Nav: signedIn false
    Note over Nav: shows "Sign in or register"
```

### Login

Whether signing in or registering a new account, the flow is the same.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant B as Browser
    participant A as Auth Lambda<br/>api.../auth/*
    participant P as ProfileNJ

    User->>B: click "Sign in or register"
    B->>A: GET /auth/login
    Note over A: make random code_verifier, state, nonce<br/>code_challenge = SHA-256(code_verifier)
    A-->>B: 302 to ProfileNJ /authorize<br/>with code_challenge, state, nonce<br/>Set-Cookie code_verifier, state, nonce (10 min)
    B->>P: GET /authorize
    Note over P: remembers code_challenge and nonce
    P-->>User: login or register page
    User->>P: email, password, MFA code
    Note over P: creates account if needed, and signs in the account
    P-->>B: 302 to api.../auth/callback?code, state
    B->>A: GET /auth/callback?code, state<br/>Cookie code_verifier, state, nonce
    Note over A: state in URL must equal state cookie
    A->>P: POST /oauth/token<br/>code, code_verifier, client_id, client_secret
    Note over P: SHA-256(code_verifier) must equal code_challenge
    P-->>A: id_token
    Note over A: nonce in id_token must equal nonce cookie<br/>also checks issuer, audience, expiry
    Note over A: session = sub, email, expires in 8 h<br/>signed with sessionSecret, tokens discarded
    A-->>B: 302 to /listing-management<br/>clear code_verifier, state, nonce<br/>Set-Cookie session (8 h)
    B-->>User: /listing-management
```

### Logout

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant B as Browser
    participant A as Auth Lambda<br/>api.../auth/*
    participant P as ProfileNJ

    User->>B: click "Log out"
    B->>A: GET /auth/logout
    A-->>B: 302 to ProfileNJ /oidc/logout<br/>with client_id, post_logout_redirect_uri<br/>Set-Cookie session expired (Max-Age=0)
    Note over B: deletes the session cookie
    B->>P: GET /oidc/logout
    Note over P: signs the browser out of ProfileNJ<br/>post_logout_redirect_uri must be in allowed_logout_urls
    P-->>B: 302 to post_logout_redirect_uri (app home page)
    B-->>User: home page, signed out
```


## Database Migrations

### Create Migration File

```bash
# Create a new migration file with the date prefix
bash api/scripts/create_migration.sh <description>

# Example:
# bash api/scripts/create_migration.sh create_listings_table

# This creates the file:
# api/migrations/20260804110544_create_listings_table.sql

# Then edit your new migration file with SQL
```

### Execute Migration

1. The Migration Lambda in the `tenant-access-stack.ts` CDK config file is bundled with the whole `api/migrations` directory. Even thought the Lambda's code itself will rarely change, we need to do a CDK deployment to include any new migration files.

2. Run `npm run deploy:dev` / `npm run deploy:prod` from the `api` directory to package the Lambda with the updated directory of migrations.

3. Note the `MigrationLambdaName` in the deployment output. For example:
`TenantAccessStack.MigrationLambdaName = TenantAccessStack-MigrationFunction1234A1A0-AbCdEFG`

3. Run the lambda with its name and the filename for the new migration.

```
aws lambda invoke \
    --function-name INSERT_LAMBDA_NAME \
    --cli-binary-format raw-in-base64-out \
    --payload '{"migrationFile":"INSERT_SQL_FILENAME"}' \
    /tmp/out.json && cat /tmp/out.json

# For example:

aws lambda invoke \
    --function-name TenantAccessStack-MigrationFunction1234A1A0-AbCdEFG \
    --cli-binary-format raw-in-base64-out \
    --payload '{"migrationFile":"20260804110544_create_listings_table.sql"}' \
    /tmp/out.json && cat /tmp/out.json
```

If you see a happy JSON like `{"statusCode":200,"body":"{\"success\":true,\"migration\":\"20260804110544_create_listings_table.sql\",\"message\":\"Migration completed successfully\"}"}`, it was a success. Otherwise, you can debug using CloudWatch.

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

### ProfileNJ Login

When testing something locally that requires actual login using ProfileNJ, you need to start a second Terminal tab and run:

```bash
npm run dev:auth
```

This creates a simple Node server that listens for calls to the `auth/*` endpoints and connects with the ProfileNJ sandbox (the same that the dev server uses).

## Testing

### Run Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# run Playwright tests
# first time requires installing chromium dependency
npx playwright install --with-deps chromium
npm run test:e2e:ui
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

Git hooks are configured via Husky to automatically run typechecks on commit. GitHub Actions will run the linting alongside automated tests on Pull Requests.

### Test Coverage

Testing coverage mandated at a 90% minimum for all measurement types for frontend and backend files. Backend DB tests also have 97% line coverage mandated. Your judgment on test coverage is important beyond meeting these guideline metrics.

### Development Principles

- Test-driven development (TDD)
- YAGNI - build only what's needed now
- Accessibility (WCAG 2.2 AA compliance)
- Simple, maintainable solutions over clever complexity

## Monitoring

AWS CloudWatch is configured by the CDK to send a message to the team's Slack channel if something looks wrong with either the backend or frontend. Re-running the CDK won't spam the Slack channel as long as it is re-run with the same values. If that starts happening, we can remove from CDK and describe the one-time process here.

## Analytics and Feedback

This app uses Google Analytics and the NJ Feedback Widget. Two separate G-XXX IDs are loaded into AWS Amplify as environment variables (one for production, one for dev).

## License

This project is licensed under the MIT license. For more information, see [LICENSE](LICENSE).

## Disclaimer

This project utilizes certain tools and technologies for development purposes. The inclusion of these tools does not imply endorsement or recommendation. Users are encouraged to evaluate the suitability of these tools for their own use.
