# CUID

Date: 2023-06-06

Status: accepted

## Context

I noticed there were a couple models that were using `uuid`. To verify my
understanding of the `uuid` vs `cuid` debate, I took it to ChatGPT.

<details>
<summary>ChatGPT conversation: CUID vs UUID Debate</summary>

**CUID vs UUID Debate** - June 6, 2023

**Kent:** Please argue both sides of the cuid vs uuid debate.

**ChatGPT:** Sure! Let's explore both sides of the debate between CUID
(Collision-resistant Unique ID) and UUID (Universally Unique Identifier).

Arguments in favor of CUID:

1.  Simplicity and readability: CUIDs are designed to be simple and
    human-readable, consisting of a combination of lowercase letters and
    numbers. This makes them easier to work with and understand compared to the
    alphanumeric strings of UUIDs.
2.  Shorter length: CUIDs are typically shorter in length compared to UUIDs,
    which can be advantageous in certain scenarios where storage or transmission
    efficiency is a concern. The shorter length can lead to reduced memory usage
    and faster processing times.
3.  Collision resistance: CUIDs are specifically designed to minimize the
    chances of collision, meaning the probability of generating duplicate IDs is
    extremely low. This makes them suitable for scenarios where uniqueness is
    crucial, such as database keys or distributed systems.

Arguments in favor of UUID:

1.  Universality and standardization: UUIDs are widely recognized and used
    across different systems and programming languages. They have a standardized
    format and are supported by various libraries and frameworks, making them
    easier to integrate into existing systems and ensure compatibility.
2.  Higher entropy and randomness: UUIDs typically have a higher degree of
    randomness due to the inclusion of a timestamp and a unique identifier from
    the host or network. This can be beneficial in situations where security and
    unpredictability are essential, such as generating secure session tokens or
    cryptographic keys.
3.  Widely adopted solutions: UUIDs have been widely adopted and proven to be
    effective in various use cases, including distributed systems, databases,
    and web applications. This extensive usage has resulted in a wealth of
    knowledge, libraries, and best practices associated with working with UUIDs,
    making them a reliable choice.

In summary, the choice between CUID and UUID depends on the specific
requirements of the application or system. CUIDs offer simplicity, shorter
length, and collision resistance, making them suitable for scenarios where
readability and uniqueness are critical. On the other hand, UUIDs provide
universality, standardization, higher entropy, and wider adoption, making them a
strong choice for applications that require compatibility, security, and a
proven track record.

</details>

That pretty much checks out for my understanding of the debate. The primary
benefit of CUIDs for the Epic Stack is their emphasis on collision resistance
which is good for distributed systems (which is the Epic Stack). Also, it's nice
to keep things smaller and more readable.

## Decision

Use CUIDs for all models instead of UUIDs.

## Consequences

No migration is necessary since the data type for CUIDs and UUIDs is both
"string". If any existing application wants to proactively update old values to
CUIDs, that's fine, but not completely necessary. All that needs to be updated
is the prisma schema for a few of the models that were using UUIDs. Generating a
new version of the client (which happens automatically at build time) is
sufficient to handle this schema change.
