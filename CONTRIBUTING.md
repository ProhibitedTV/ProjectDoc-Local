# Contributing

ProjectDoc Local is a private commercial repository. Contribution access is limited to authorized collaborators working on the product. This document sets the quality bar for changes in this codebase.

## Core Expectations

- Build for production-adjacent use, not demo-only behavior.
- Favor clarity, reviewability, and operational discipline over cleverness.
- Treat privacy, auditability, and maintainability as product requirements.
- Keep changes small enough to review properly.

## Before You Start

- Make sure the proposed change is aligned with the current roadmap and documented scope.
- For cross-cutting changes, write down the design intent before implementation.
- If a change affects product behavior, update the relevant documentation in the same pull request.

## Required Quality Bar

Every material change should meet the following standards:

- It solves a real product or engineering need.
- It is understandable by the next engineer who has to maintain it.
- It includes appropriate test coverage for the risk level of the change.
- It does not weaken auditability, privacy boundaries, or operator control.
- It does not introduce hidden coupling or unexplained configuration.

If a change is difficult to review, it is not ready to merge.

## Product Guardrails

The following assumptions should guide implementation decisions:

- Human review must remain possible for consequential outputs.
- System decisions and user corrections must be traceable.
- Silent data loss, silent overwrites, and unlogged workflow changes are unacceptable.
- Real customer documents, secrets, and production-derived datasets must not be committed to the repository.
- AI behavior should be framed conservatively and instrumented for review.

## Testing and Evidence

Contributors are expected to provide evidence proportional to the change:

- unit tests for isolated logic
- integration tests for workflow and persistence behavior
- fixtures that are synthetic or sanitized
- notes on operational impact when changing ingestion, storage, auth, or audit paths

If tests are not practical for a specific change, explain why and identify the remaining risk clearly in the review.

Before asking for review on a material change, run `pnpm verify` from the repository root. If a step is knowingly skipped, say so explicitly in the change description.

## Dependencies and Tooling

- Add new dependencies only when they are justified and maintainable.
- Prefer well-understood libraries over fashionable ones.
- Keep local development and on-prem deployment needs in mind when selecting tooling.
- Avoid introducing services that quietly assume public cloud dependencies.

## Security and Data Handling

- Follow the reporting guidance in `SECURITY.md`.
- Never commit credentials, tokens, customer files, or sensitive logs.
- Redact examples and screenshots so they are safe for long-term storage in the repository.

## Pull Request Expectations

Each pull request should clearly explain:

- what changed
- why it changed
- what risks were considered
- how it was validated
- what documentation was updated

Reviewers should feel confident that the change can be operated, tested, and maintained, not just that it compiles.
