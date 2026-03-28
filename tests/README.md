# Workspace Tests

This directory is reserved for cross-application and system-level test suites.

Use it for flows that need more than one package or runtime boundary, such as:

- browser-based end-to-end coverage
- API and worker integration scenarios
- Dockerized smoke checks for on-prem packaging

Package-local unit and integration tests should stay beside the code they exercise.
