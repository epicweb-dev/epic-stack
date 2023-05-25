# GitHub Actions

Date: 2023-05-15

Status: accepted

## Context

Deploying serious web applications to production on a regular basis requires
automation. Running testing, linting, and a build before deployment is a
accepted practice to ensure a quality product is deployed.

Alongside this, we want to run this automation any time code is merged (or will
soon be merged) from contributors to the project. This is called "Continuous
Integration" and is necessary for teams to move confidently and focus on their
value proposition. Make the robots do the boring stuff so we can focus on the
creative work.

We can run this automation on our own machines during development, but it can be
easy to forget to do this. It's even harder to be confident the automation was
run when you are trying to combine the work of multiple people (who's
responsible to run the deploy script?). So it's best to have this automation run
on a separate machine that's dedicated to this task.

I don't want to have that machine running in my closet, so instead we need to
look to outside services for managing this for us. There are many such services.
Most of the target audience of the Epic Stack are familiar with GitHub and many
use it already for other projects. The vast majority already have accounts on
GitHub as well.

GitHub has a CI service called
[GitHub Actions](https://docs.github.com/en/actions) which satisfies all the
necessary use cases for the Epic Stack. It does not require an additional
account, though it does necessitate you use GitHub for hosting the code. Also,
it is free for open source projects, but paid for private projects.

## Decision

We've decided to use GitHub Actions for Continuous Integration in the Epic
Stack. We have a single action that handles running linting, type checking,
tests, and deployment to both staging (`dev` branch) and production (`main`
branch).

## Consequences

This means users of the Epic Stack must host their repositories within GitHub
and pay for private repositories. This reduces the number of extra services
users of the Epic Stack need to sign up for since the vast majority already have
accounts with GitHub anyway.
