# Architectural Decision Log

This directory contains all the decisions we've made for this starter template
and serves as a record for whenever we wonder why certain decisions were made.

Decisions in here are never final. But these documents should serve as a good
way for someone to come up to speed on why certain decisions were made.

<!-- adrlog -->

* [ADR-00](00-typescript-only.md) - TypeScript Only
* [ADR-01](01-email-service.md) - Email Service
* [ADR-02](02-sqlite.md) - SQLite
* [ADR-03](03-github-actions.md) - GitHub Actions
* [ADR-04](04-client-pref-cookies.md) - Client Preference Cookies
* [ADR-05](05-use-markdown-architectural-decision-records.md) - Use Markdown Architectural Decision Records
* [ADR-06](06-native-esm.md) - Native ESM

<!-- adrlogstop -->

## Creating a new ADR

- Copy the `adr-template.md` file into the decisions directory with a filename
  format of `NNNN-title-with-dashes.md`, where `NNNN` indicates the next number
  in sequence. i.e.
  `cp docs/adr-template.md docs/decisions/0001-title-with-dashes.md`
- Edit `NNNN-title-with-dashes.md`.
- Update index.md: `yarn adr:update`

## Misc Info

More information on MADR is available at <https://adr.github.io/madr/>. General
information about architectural decision records is available at
<https://adr.github.io/>.
