# PwnedPasswords Integration

Date: 2025-03-22

Status: accepted

## Context

Password security is a critical concern for web applications. While we already
have strong password requirements (minimum length, complexity, etc.), we wanted
to add an additional layer of security by checking if a password has been
exposed in known data breaches using the HaveIBeenPwned Password API.

However, we wanted to implement this in a way that:

1. Doesn't block users if the service is unavailable
2. Doesn't slow down the development experience
3. Maintains security in production

## Decision

We will integrate the HaveIBeenPwned Password API with the following approach:

1. **Progressive Enhancement**
   - The password check is implemented as a non-blocking enhancement
   - If the check fails or times out (>1s), we allow the password
   - This ensures users can still set passwords even if the service is
     unavailable

2. **Development Experience**
   - The API calls are mocked during development and testing using MSW (Mock
     Service Worker)
   - This prevents unnecessary API calls during development
   - Allows for consistent testing behavior
   - Follows our pattern of mocking external services

3. **Error Handling**
   - Timeout after 1 second to prevent blocking users
   - Graceful fallback if the service is unavailable
   - Warning logs for monitoring service health
   - No user-facing errors for service issues

4. **Implementation Details**
   - Core logic centralized in `auth.server.ts`
   - Mock handlers in `tests/mocks/pwnedpasswords.ts`
   - Consistent with our existing auth patterns

## Consequences

This approach provides several benefits:

1. **Security**: We get the benefits of checking against known compromised
   passwords without making it a hard requirement
2. **Reliability**: Users can still use the application even if the service is
   down
3. **Development**: Fast development experience with mocked responses
4. **Testing**: Consistent test behavior with mocked responses
5. **Monitoring**: Warning logs help track service health

The main tradeoff is that we might occasionally allow passwords that have been
compromised if the service is unavailable. However, this is an acceptable
tradeoff given our other security measures and the importance of application
availability.

This implementation aligns with our principles of progressive enhancement and
maintaining a great development experience while adding security features.
