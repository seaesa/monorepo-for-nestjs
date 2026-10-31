# Architecture decision records

One file per decision that is expensive to reverse or that a newcomer (human or AI) would
otherwise question: a library choice, a boundary, a security model, a data rule.

- Name: `NNNN-kebab-title.md`, numbered in order. Never renumber or delete; a reversed decision
  gets a new ADR that supersedes the old one (set the old one's status to `Superseded by NNNN`).
- Keep it under a page. Write the forces, not a tutorial.
- Copy `template.md`.

| ADR                                       | Decision                                         |
| ----------------------------------------- | ------------------------------------------------ |
| [0001](0001-contract-first-zod.md)        | One zod contract drives API, web and mobile      |
| [0002](0002-web-cookies-mobile-bearer.md) | Web sessions in httpOnly cookies, mobile bearer  |
| [0003](0003-authorization-with-casl.md)   | Permissions declared once with CASL              |
| [0004](0004-oxc-toolchain.md)             | oxlint + oxfmt instead of ESLint + Prettier      |
| [0005](0005-error-codes-and-i18n.md)      | Errors are codes; all text lives in `@repo/i18n` |
