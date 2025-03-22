# Node's Built-in SQLite Support

Date: 2025-03-22

Status: accepted

## Context

The Epic Stack previously used `better-sqlite3` as the SQLite driver for
Node.js. While `better-sqlite3` is a mature and feature-rich library, Node.js
has recently added built-in SQLite support through the `node:sqlite3` module.
This built-in support provides a simpler, more maintainable solution that
doesn't require additional dependencies.

The built-in SQLite support in Node.js is based on the same underlying SQLite
engine, ensuring compatibility with our existing database schema and queries. It
also provides a Promise-based API that aligns well with modern JavaScript
practices.

## Decision

We will switch from `better-sqlite3` to Node's built-in SQLite support
(`node:sqlite3`) for the following reasons:

1. Reduced dependencies - one less package to maintain and update
2. Native integration with Node.js - better long-term support and compatibility
3. Simpler setup - no need to handle native module compilation
4. Official Node.js support - better reliability and future-proofing

## Consequences

This change will require:

1. Updating database connection code to use the new API
2. Removing `better-sqlite3` from package.json and lockfile

The migration should be relatively straightforward since both libraries use the
same underlying SQLite engine. The main changes will be in the API usage
patterns rather than the database functionality itself.

This change aligns with our goal of simplifying the stack while maintaining
robust functionality. The built-in SQLite support provides all the features we
need without the overhead of an additional dependency.
