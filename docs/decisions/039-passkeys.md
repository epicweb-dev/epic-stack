# Passkeys

Date: 2025-02-19

Status: accepted

## Context

The Epic Stack has traditionally supported two primary authentication methods:
username/password and OAuth providers. While these methods are widely used, they
come with various security challenges:

1. Password-based authentication:

   - Users often reuse passwords across services
   - Passwords can be phished or stolen
   - Password management is a burden for users
   - Password reset flows are complex and potential security vectors

2. OAuth providers:
   - Dependency on third-party services
   - Privacy concerns with data sharing
   - Not all users have or want to use social accounts
   - Service outages can affect authentication

The web platform now supports WebAuthn, a standard for passwordless
authentication that enables the use of passkeys. Passkeys represent a
significant advancement in authentication security and user experience.

WebAuthn (Web Authentication) is a web standard published by the W3C that
enables strong authentication using public key cryptography instead of
passwords. The standard allows websites to register and authenticate users
using:

1. Platform authenticators built into devices (like Touch ID, Face ID,
   1Password, etc.)
2. Roaming authenticators (security keys, phones acting as security keys)

The authentication flow works as follows:

1. Registration:

   - Server generates a challenge and sends registration options
   - Client creates a new key pair and signs the challenge with the private key
   - Public key and metadata are sent to the server for storage
   - Private key remains securely stored in the authenticator

2. Authentication:

   - Server generates a new challenge
   - Client signs it with the stored private key
   - Server verifies the signature using the stored public key

This provides several security benefits:

- Private keys never leave the authenticator
- Each credential is unique to the website (preventing phishing)
- Biometric/PIN verification happens locally
- No shared secrets are stored on servers

### Multiple Authentication Strategies

While passkeys represent the future of authentication, we maintain support for
password and OAuth authentication because:

1. Adoption and Transition:

   - Passkey support is still rolling out across platforms and browsers
   - Users need time to become comfortable with the new technology
   - Organizations may have existing requirements for specific auth methods

2. Fallback Options:

   - Some users may not have compatible devices
   - Enterprise environments might restrict biometric authentication
   - Backup authentication methods provide reliability

3. User Choice:

   - Different users have different security/convenience preferences
   - Some scenarios may require specific authentication types
   - Supporting multiple methods maximizes accessibility

By supporting all three methods, we provide a smooth transition path to passkeys
while ensuring no users are left behind.

## Decision

We will implement passkey support in the Epic Stack using the SimpleWebAuthn
libraries (@simplewebauthn/server and @simplewebauthn/browser) which provide a
robust implementation of the WebAuthn standard. The implementation will:

1. Allow users to register multiple passkeys for their account
2. Support both platform authenticators (built into devices) and cross-platform
   authenticators (security keys)
3. Store passkey data in a dedicated Prisma model that tracks:
   - Authenticator metadata (AAGUID, device type, transports)
   - Security information (public key, counter)
   - User relationship and timestamps
4. Provide a clean UI for managing passkeys in the user settings
5. Support passkey-based login as a first-class authentication method

We chose SimpleWebAuthn because:

- It's well-maintained and widely used
- It provides type-safe implementations for both client and server
- It handles the complexity of the WebAuthn specification
- It supports all major browsers and platforms

## Consequences

### Positive:

1. Enhanced Security for Users:

   - Phishing-resistant authentication adds protection against common attacks
   - Hardware-backed security provides stronger guarantees than passwords alone
   - Biometric authentication reduces risk of credential sharing

2. Improved User Experience Options:

   - Users can choose between password, OAuth, or passkey based on their needs
   - Native biometric flows provide fast and familiar authentication
   - Password manager integration enables seamless cross-device access
   - Multiple authentication methods increase accessibility

3. Future-Proofing Authentication:

   - Adoption of web standard
   - Gradual transition path as passkey support grows
   - Meeting evolving security best practices

### Negative:

1. Implementation Complexity:

   - WebAuthn is a complex specification
   - Need to handle various device capabilities
   - Must maintain backward compatibility
   - Need to maintain password-based auth as fallback

2. User Education:

   - New technology requires user education
   - Some users may be hesitant to adopt
   - Need clear documentation and UI guidance

### Neutral:

1. Data Storage:

   - New database model for passkeys
   - Additional storage requirements per user
   - Migration path for existing users

2. Testing:
   - New test infrastructure for WebAuthn
   - Mock authenticator support for development
   - Additional e2e test scenarios
