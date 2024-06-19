# Generated Internal Command Env Var

Date: 2024-06-19

Status: accepted

## Context

There are use cases where your application needs to talk to itself over HTTP.
One example of this is when a read-replica instance needs to trigger an update
to the cache in the primary instance. This can be done by making an HTTP request
to the primary instance.

To secure this communication, we can use a secret token that is shared between
the instances. This token can be stored in the environment variables of the
instances.

Originally, this token was manually generated once and set as a secret in the
Fly app. This token was then used in the application code to authenticate the
requests.

However, this manual process is error-prone and can lead to security issues if
the token is leaked.

An alternative is to generate the token in the Dockerfile and set it as an
environment variable in the Fly app. This way, the token is generated
automatically and is unique for each deployment.

One drawback to this is during the deployment process, an old replica might
still be running with the old token. This can cause issues if the new replica is
expecting the new token. However, this should be short-lived and it's also
possible the read replica is running out-of-date code anyway so it may be to our
benefit anyway.

## Decision

We will generate the internal command token in the Dockerfile and set it as an
environment variable in the Fly app.

## Consequences

We'll need to remove the steps during initial setup and the documentation
instructions. This will simplify the setup process and reduce the risk of
security issues due to leaked tokens.
