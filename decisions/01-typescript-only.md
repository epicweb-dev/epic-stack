# TypeScript Only

Date: 2023-05-08

Status: accepted

## Context

The `create-remix` CLI allows users to select whether they want to use
JavaScript instead of TypeScript. This will auto-convert everything to
TypeScript.

There is (currently) no way to control this behavior.

Teams and individuals building modern web applications have many great reasons
to build them with TypeScript.

One of the challenges with TypeScript is getting it configured properly. This is
not an issue with a stack which starts you off on the right foot without needing
to configure anything.

Another challenge with TypeScript is handling dependencies that are not written
in TypeScript. This is increasingly becoming less of an issue with more and more
dependencies being written in TypeScript.

## Decision

We strongly advise the use of TypeScript even for simple projects and those
worked on by single developers. So instead of working on making this project
work with the JavaScript option of the `create-remix` CLI, we've decided to
throw an error informing the user to try again and select the TypeScript option.

We've also made the example script in the `README.md` provide a selected option
of `--typescript` so folks shouldn't even be asked unless they leave off that
flag in which case our error will be thrown.

## Consequences

This makes the initial experience not great for folks using JavaScript.
Hopefully the Remix CLI will eventually allow us to have more control over
whether that question is asked.

This also may anger some folks who really don't like TypeScript. For those
folks, feel free to fork the starter.
