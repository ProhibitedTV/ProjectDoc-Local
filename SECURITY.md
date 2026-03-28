# Security Policy

ProjectDoc Local is being built for privacy-sensitive document workflows. Security issues should be handled carefully and reported through private channels.

## Reporting a Security Issue

Do not open a public issue or public pull request with exploit details.

If you have authorized access to this repository, report suspected vulnerabilities directly to the maintainers or product owners through an approved private channel used by the team. Include:

- the affected component or area
- a clear description of the issue
- reproduction steps when available
- likely impact
- any logs, payloads, or screenshots needed to understand the issue, with sensitive data removed

## Scope

Relevant security issues include, but are not limited to:

- unauthorized document or metadata access
- secrets exposure
- broken authentication or authorization behavior
- unsafe file handling or ingestion paths
- data leakage across projects or users
- insecure export or integration behavior
- audit log tampering or gaps in traceability

## Handling Expectations

- Reports should remain private until the issue is understood and a response path is agreed.
- Sensitive materials should be minimized and redacted where possible.
- The team will review reports as resources allow and prioritize based on risk.

## Supported Versions

Until formal releases exist, the active `main` branch is the primary supported line for security fixes and review.

## Operational Security Requirements

Contributors and operators should assume:

- no real customer documents belong in test fixtures or example data
- secrets must be managed outside the repository
- local deployment does not remove the need for access control, logging, and secure configuration

Security is part of the product definition, not a hardening pass to be added later.
