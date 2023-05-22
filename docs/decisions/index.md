# Architectural Decision Log

This directory contains all the decisions we've made for this starter template
and serves as a record for whenever we wonder why certain decisions were made.

Decisions in here are never final. But these documents should serve as a good
way for someone to come up to speed on why certain decisions were made.


<!-- adrlog -->

* [ADR-0000](0000-typescript-only.md) - TypeScript Only
* [ADR-0001](0001-email-service.md) - Email Service
* [ADR-0002](0002-sqlite.md) - SQLite
* [ADR-0003](0003-github-actions.md) - GitHub Actions
* [ADR-0004](0004-client-pref-cookies.md) - Client Preference Cookies
* [ADR-0005](0005-native-esm.md) - Native ESM
* [ADR-0005](0005-use-markdown-architectural-decision-records.md) - te: 2023-05-22

<!-- adrlogstop -->


## Creating a new ADR

* Copy the `adr-template.md` file into the decisions directory with a filename format of `NNNN-title-with-dashes.md`, where `NNNN` indicates the next number in sequence. i.e. `cp docs/adr-template.md docs/decisions/0001-title-with-dashes.md`
* Edit `NNNN-title-with-dashes.md`.
* Update index.md: `yarn adr:update`

## Misc Info

More information on MADR is available at <https://adr.github.io/madr/>.
General information about architectural decision records is available at <https://adr.github.io/>.