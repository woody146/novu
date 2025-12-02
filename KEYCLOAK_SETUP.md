# Keycloak OAuth Integration Guide

This guide explains how to integrate Keycloak authentication with Novu Community Edition.

## Overview

Keycloak integration allows users to authenticate with Novu using their Keycloak credentials via OAuth2/OIDC.

**Auto-Registration Enabled**: When a user logs in with Keycloak for the first time, a Novu account will be automatically created with their Keycloak profile information (email, name, avatar).

⚠️ **Security Note**: Any user with a valid Keycloak account in your configured realm will be able to create a Novu account. Make sure your Keycloak realm only contains users who should have access to your Novu instance.

## Prerequisites

1. A running Keycloak server (version 20+ recommended)
2. Admin access to Keycloak
3. Novu Community Edition installed

## Keycloak Configuration

### Step 1: Create a Realm (Optional)

If you don't have an existing realm:

1. Log in to Keycloak Admin Console
2. Click the realm dropdown (top-left)
3. Click "Create Realm"
4. Enter a realm name (e.g., `novu`)
5. Click "Create"

### Step 2: Create a Client

1. Navigate to **Clients** in the left sidebar
2. Click **Create client**
3. Configure the client:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `novu` (or your preferred ID)
   - Click **Next**

4. **Capability config**:
   - Enable **Client authentication**
   - Enable **Authorization**
   - Enable **Standard flow**
   - Click **Next**

5. **Login settings**:
   - **Root URL**: `http://localhost:4200` (or your Novu web app URL)
   - **Home URL**: `http://localhost:4200`
   - **Valid redirect URIs**:
     - `http://localhost:3000/v1/auth/keycloak/callback` (API callback)
     - `http://localhost:4200/*` (Frontend)
   - **Valid post logout redirect URIs**: `http://localhost:4200/*`
   - **Web origins**: `http://localhost:4200`
   - Click **Save**

### Step 3: Get Client Credentials

1. Navigate to your client in Keycloak
2. Go to the **Credentials** tab
3. Copy the **Client secret** - you'll need this for Novu configuration

### Step 4: Configure Client Scopes (Optional)

Ensure your client has access to these scopes:
- `openid` (required)
- `email` (required)
- `profile` (required)

These are typically enabled by default.

### Step 5: Configure Required User Attributes

To ensure Novu can create accounts properly, Keycloak users must have these attributes:

1. Navigate to **Realm Settings** → **User Profile**
2. Ensure these attributes are enabled:
   - **Email** (required) - Used to match/create Novu users
   - **First Name** (optional but recommended)
   - **Last Name** (optional but recommended)

### Step 6: Create Test Users

1. Navigate to **Users** in Keycloak
2. Click **Add user**
3. Fill in user details:
   - **Username**: test@example.com
   - **Email**: test@example.com (⚠️ **Required** - Novu uses this for account creation)
   - **First name**: Test
   - **Last name**: User
   - **Email verified**: ON
4. Click **Create**
5. Go to the **Credentials** tab
6. Click **Set password**
7. Enter a password and disable **Temporary**
8. Click **Save**

**Note:** With auto-registration enabled, a Novu account will be automatically created on first login. No need to pre-register in Novu.

## Novu Configuration

### Environment Variables

Add these environment variables to your Novu API configuration:

```bash
# Keycloak OAuth Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=novu
KEYCLOAK_CLIENT_ID=novu
KEYCLOAK_CLIENT_SECRET=your_client_secret_here
```

#### Configuration Details:

- **KEYCLOAK_URL**: Base URL of your Keycloak server (without `/auth` or realm path)
- **KEYCLOAK_REALM**: The realm name you created/are using
- **KEYCLOAK_CLIENT_ID**: The client ID you created
- **KEYCLOAK_CLIENT_SECRET**: The client secret from Keycloak credentials tab

### Docker Environment

If using Docker, add to `docker/.env`:

```bash
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=novu
KEYCLOAK_CLIENT_ID=novu
KEYCLOAK_CLIENT_SECRET=your_client_secret_here
```

### Local Development

For local development, add to `apps/api/src/.env`:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=novu
KEYCLOAK_CLIENT_ID=novu
KEYCLOAK_CLIENT_SECRET=your_client_secret_here
```

## Testing the Integration

### Step 1: Restart Novu Services

After configuring environment variables, restart:
- API service
- Web application

```bash
# If using pnpm
pnpm start:api:dev
pnpm start:web

# If using Docker
docker-compose restart api web
```

### Step 2: Test Keycloak Login (First-Time User)

1. Navigate to `http://localhost:4200/auth/login`
2. You should see a "Sign In with Keycloak" button
3. Click the button
4. You'll be redirected to Keycloak login page
5. Enter your Keycloak credentials
6. **First login**: A new Novu account will be automatically created
7. You should be redirected back to Novu and logged in
8. Your Novu account will have:
   - Email from Keycloak
   - Name from Keycloak profile
   - Avatar from Keycloak (if available)

### Step 3: Test Subsequent Logins

1. Log out from Novu
2. Click "Sign In with Keycloak" again
3. You'll be logged in without creating a duplicate account

## Troubleshooting

### "Sign In with Keycloak" button not showing

**Possible causes:**
- Keycloak environment variables not set correctly
- API service not restarted after configuration
- API cannot reach Keycloak server

**Check:**
```bash
# Test if Keycloak is reachable from API
curl http://localhost:3000/v1/auth/keycloak

# Should return: {"success": true}
# If error, check environment variables
```

### Duplicate accounts created

**Cause:** User registered manually in Novu before using Keycloak login.

**Solution:**
- If emails match exactly, only one account will be used
- Keycloak login will find and use existing account by email
- No duplicates will be created if emails are identical

### Redirect URI mismatch error

**Cause:** The callback URL doesn't match Keycloak client configuration.

**Solution:**
1. Check that `API_ROOT_URL` is set correctly in Novu
2. Verify redirect URIs in Keycloak client settings match:
   - `{API_ROOT_URL}/v1/auth/keycloak/callback`

### Invalid client or client credentials

**Cause:** Client ID or secret is incorrect.

**Solution:**
1. Verify `KEYCLOAK_CLIENT_ID` matches the client ID in Keycloak
2. Regenerate client secret in Keycloak if needed
3. Update `KEYCLOAK_CLIENT_SECRET` environment variable

### CORS errors

**Cause:** Web origin not allowed in Keycloak.

**Solution:**
1. Go to Keycloak client settings
2. Add your frontend URL to **Web origins** (e.g., `http://localhost:4200`)

## Security Considerations

### Auto-Registration Security

⚠️ **Critical**: With auto-registration enabled (default), any user with a valid Keycloak account in your realm can create a Novu account.

**Best Practices:**

1. **Dedicated Realm**: Use a dedicated Keycloak realm for Novu users only
   ```
   - Don't use your main corporate realm
   - Create realm: "novu-users" or "notifications"
   ```

2. **Email Domain Restrictions**: In Keycloak, configure email domain validation
   - Go to Realm Settings → Login
   - Enable email verification
   - Use custom authenticators to restrict domains

3. **Manual User Approval**: Consider disabling auto-registration and manually creating users

4. **Group/Role Mapping**: Use Keycloak groups/roles to control access
   - Configure required groups in Keycloak client
   - Only users in specific groups can authenticate

5. **Monitor New Registrations**: Set up analytics/alerts for new account creation
   ```typescript
   // Already tracked in auth.service.ts:
   this.analyticsService.track('[Authentication] - Signup', user._id, {
     loginType: 'keycloak',
   });
   ```

### Production Deployment

For production environments:

1. **Use HTTPS**: Always use HTTPS for both Keycloak and Novu
   ```bash
   KEYCLOAK_URL=https://keycloak.yourdomain.com
   API_ROOT_URL=https://api.novu.yourdomain.com
   ```

2. **Secure the client secret**: Use secret management tools (e.g., Vault, AWS Secrets Manager)

3. **Restrict redirect URIs**: Use specific URIs instead of wildcards
   ```
   https://api.novu.yourdomain.com/v1/auth/keycloak/callback
   https://app.novu.yourdomain.com/auth/login
   ```

4. **Enable PKCE**: In Keycloak client settings, enable **Proof Key for Code Exchange**

5. **Set token expiration**: Configure appropriate session and token timeouts in Keycloak

### Network Considerations

- Ensure Novu API can reach Keycloak server (check firewalls, network policies)
- For Docker deployments, use Docker network names:
  ```bash
  KEYCLOAK_URL=http://keycloak:8080  # Instead of localhost
  ```

## Advanced Configuration

### Custom Scopes

To request additional scopes from Keycloak, modify:

`apps/api/src/app/auth/community.auth.module.config.ts`

```typescript
if (process.env.KEYCLOAK_CLIENT_ID) {
  consumer
    .apply(
      passport.authenticate('keycloak', {
        session: false,
        scope: ['openid', 'email', 'profile', 'custom-scope'], // Add your scopes here
      })
    )
    .forRoutes({
      path: '/auth/keycloak',
      method: RequestMethod.GET,
    });
}
```

### Custom User Attribute Mapping

To map additional Keycloak user attributes, modify:

`apps/api/src/app/auth/services/passport/keycloak.strategy.ts`

```typescript
const normalizedProfile = {
  name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
  login: profile.preferred_username || profile.email?.split('@')[0] || profile.sub,
  email: profile.email || '',
  avatar_url: profile.picture || '',
  id: profile.sub,
  // Add custom attributes from Keycloak
  customAttribute: profile.customAttribute,
};
```

## Disabling Auto-Registration (Optional)

By default, Keycloak login will automatically create Novu accounts for new users. To disable this and only allow existing Novu users to log in:

**Use case:** When you want manual control over who can access Novu.

Modify `apps/api/src/app/auth/services/passport/keycloak.strategy.ts`:

```typescript
const response = await this.authService.authenticate(
  'keycloak' as AuthProviderEnum,
  accessToken,
  refreshToken,
  normalizedProfile,
  parsedState?.distinctId,
  {
    origin: parsedState?.source,
    invitationToken: parsedState?.invitationToken,
    allowRegistration: false, // Change to false - only allow existing users
  }
);
```

With this setting:
- Only users who already have Novu accounts can log in via Keycloak
- Users must be manually registered in Novu first (via standard signup or admin)
- Keycloak login will match users by email address

## Architecture

### Authentication Flow

```
1. User clicks "Sign In with Keycloak"
   ↓
2. Frontend redirects to: /v1/auth/keycloak
   ↓
3. API redirects to Keycloak login page
   ↓
4. User enters credentials in Keycloak
   ↓
5. Keycloak redirects to: /v1/auth/keycloak/callback
   ↓
6. API validates OAuth code and fetches user profile
   ↓
7. API looks up user by email in Novu database
   ↓
8. If found: Generate JWT token and login
   If not found: Create new Novu account → Generate JWT token
   ↓
9. Redirect to frontend with token
   ↓
10. User is logged in
```

**Auto-Registration Details:**
- When a new user logs in via Keycloak, Novu automatically creates an account with:
  - Email from Keycloak profile
  - First name and last name from Keycloak `name` field
  - Username from Keycloak `preferred_username` or email prefix
  - Profile picture from Keycloak `picture` field (if available)
  - Authentication provider set to "keycloak"
  - Organization automatically created for the new user

### Files Modified

**Backend:**
- `apps/api/src/app/auth/services/passport/keycloak.strategy.ts` - Passport strategy
- `apps/api/src/app/auth/auth.controller.ts` - OAuth endpoints
- `apps/api/src/app/auth/community.auth.module.config.ts` - Module configuration
- `apps/api/src/app/auth/services/community.auth.service.ts` - Authentication logic
- `packages/shared/src/entities/user/user.enums.ts` - Auth provider enum
- `packages/shared/src/types/auth.ts` - Auth context type

**Frontend (Web App):**
- `apps/web/src/pages/auth/components/OAuth.tsx` - OAuth buttons
- `apps/web/src/pages/auth/components/keycloakUtils.ts` - URL builder

## Support

For issues or questions:
- Check Keycloak logs: `docker logs keycloak` or check Keycloak server logs
- Check Novu API logs for authentication errors
- Verify all environment variables are set correctly
- For auto-registration issues:
  - Check that email is provided by Keycloak
  - Verify email format is valid
  - Check for existing users with same email

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [OpenID Connect](https://openid.net/connect/)
- [Passport.js OAuth2 Strategy](http://www.passportjs.org/packages/passport-oauth2/)
