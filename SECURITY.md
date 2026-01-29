# Security Policy

## Overview

Simple Notes Manager is currently a frontend-only React application that depends on an external backend API for data persistence. At present, the frontend does not implement authentication, authorization, or token management. Any access control is expected to be enforced by the backend.

This document describes the current security posture and expectations for future changes.

## Supported versions

This repository does not currently publish multiple supported versions. Security fixes should be applied to the main development line.

## Sensitive data and tokens

The current implementation does not use tokens, cookies, or other credentials directly in the frontend.

If authentication is added in the future:

- Do not store long-lived tokens in `localStorage` unless you have a strong reason and threat model. Prefer secure, HTTP-only cookies when feasible.
- Ensure tokens are never logged to the console or included in error messages.
- Treat environment variables as build-time configuration; do not embed secrets in `REACT_APP_*` variables because they become part of the shipped JavaScript bundle.

## Dependency management

- Keep dependencies up to date, especially `react-scripts` and transitive packages.
- Regularly run `npm audit` and address high/critical issues promptly.
- Prefer minimal dependencies to reduce attack surface.

## Transport security

- Use HTTPS in production. If the frontend is served over HTTPS, the backend must also be HTTPS to avoid mixed-content blocking and to protect note content in transit.
- If frontend and backend are on different origins, configure backend CORS safely with an allowlist of trusted origins.

## Reporting vulnerabilities

If you discover a security issue:

1. Do not open a public issue with exploit details.
2. Provide a clear description of the vulnerability, steps to reproduce, and any proof-of-concept if available.
3. Share the impact assessment (what data could be accessed, modified, or exfiltrated).

Task completed: SECURITY policy added with current posture and future-safe guidance for token handling and dependency updates.
