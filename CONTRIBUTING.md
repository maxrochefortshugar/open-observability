# Contributing to open-observability

Thank you for your interest in contributing to open-observability! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (free tier works)

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/open-observability.git
   cd open-observability
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build all packages:
   ```bash
   npm run build
   ```

### Project Structure

```
open-observability/
  packages/
    tracker/     # Lightweight browser tracking script
    sdk/         # Server-side SDK for querying analytics data
    dashboard/   # Next.js analytics dashboard
  supabase/
    migrations/  # Database schema migrations
    functions/   # Supabase Edge Functions (ingestion endpoint)
```

### Running Locally

1. Copy environment files:
   ```bash
   cp packages/dashboard/.env.example packages/dashboard/.env.local
   ```
2. Fill in your Supabase credentials
3. Apply database migrations to your Supabase project
4. Start the dashboard:
   ```bash
   npm run dev:dashboard
   ```

## Making Changes

### Branching

- Create a feature branch from `main`: `git checkout -b feat/my-feature`
- Use prefixes: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`

### Code Style

- We use TypeScript throughout the project
- Run `npm run typecheck` before submitting
- Follow existing patterns and conventions

### Commit Messages

Use conventional commit format:

```
feat: add session tracking
fix: resolve CLS measurement race condition
docs: update setup instructions
```

### Testing

- Add tests for new functionality
- Run existing tests before submitting: `npm test`
- The tracker must stay under 10 KB (minified, uncompressed)

## Pull Requests

1. Ensure all tests pass
2. Update documentation if needed
3. Keep PRs focused on a single change
4. Provide a clear description of what and why

## Reporting Bugs

Use the GitHub issue template for bug reports. Include:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, OS, versions)

## Feature Requests

Open an issue with the feature request template. We value:

- Clear problem statements
- Proposed solutions with trade-off analysis
- Alignment with the project's goals (lightweight, privacy-respecting, open)

## Code of Conduct

Be respectful and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
