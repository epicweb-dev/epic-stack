# Email

This document describes how to get [Mailgun](https://mailgun.com) (the Epic
Stack email provider) setup.

> **NOTE**: this is an optional step. During development the emails will be
> logged to the terminal and in production if you haven't set the proper
> environment variables yet you will get a warning until you set the environment
> variables.

Create a Sending API Key (find it at
`https://app.mailgun.com/app/sending/domains/YOUR_SENDING_DOMAIN/sending-keys`
replacing `YOUR_SENDING_DOMAIN` with your sending domain) and set
`MAILGUN_DOMAIN` and `MAILGUN_SENDING_KEY` environment variables in both prod
and staging:

```sh
fly secrets set MAILGUN_DOMAIN="mg.example.com" MAILGUN_SENDING_KEY="some-api-token-with-dashes" --app [YOUR_APP_NAME]
fly secrets set MAILGUN_DOMAIN="mg.example.com" MAILGUN_SENDING_KEY="some-api-token-with-dashes" --app [YOUR_APP_NAME]-staging
```
