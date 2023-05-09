# Epic Stack Guiding Principles

Decisions about the Epic Stack should be guided by the following guiding
principles:

- **Limit Third Party Services:** If we can reasonably build, deploy, maintain
  it ourselves, do it. This saves on cost and reduces complexity.
- **Include Only Most Common Use Cases:** As a project generator, it is expected
  that some code will necessarily be deleted, but implementing support for every
  possible type of feature is literally impossible. _The starter app is not
  docs_, so to demonstrate a feature or give an example, put that in the docs
  instead of in the starter app.
- **Reduce Setup Friction:** Try to keep the amount of time it takes to get an
  app to production as small as possible. If a service is necessary, see if we
  can defer signup for that service until its services are actually required.
  Additionally, while the target audience for this stack is apps that need scale
  you have to pay for, we try to fit within the free tier of any services used
  during the exploration phase.
- **Optimize for Adaptability:** While we feel great about our opinions,
  ever-changing product requirements sometimes necessitate swapping trade-offs.
  So while we try to keep things simple, we want to ensure teams using the Epic
  Stack are able to adapt by switching between third party services to
  custom-built services and vice-versa.
