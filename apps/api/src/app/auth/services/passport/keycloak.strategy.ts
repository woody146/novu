import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthProviderEnum } from '@novu/shared';
import {
  Metadata,
  Strategy as OAuth2Strategy,
  StateStoreStoreCallback,
  StateStoreVerifyCallback,
} from 'passport-oauth2';
import { AuthService } from '../auth.service';

interface KeycloakProfile {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
}

@Injectable()
export class KeycloakStrategy extends PassportStrategy(OAuth2Strategy, 'keycloak') {
  constructor(private authService: AuthService) {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const keycloakRealm = process.env.KEYCLOAK_REALM;
    const keycloakBaseUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect`;

    super({
      authorizationURL: `${keycloakBaseUrl}/auth`,
      tokenURL: `${keycloakBaseUrl}/token`,
      clientID: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      callbackURL: `${process.env.API_ROOT_URL}/v1/auth/keycloak/callback`,
      scope: ['openid', 'email', 'profile'],
      passReqToCallback: true,
      store: {
        verify(_req: any, _state: string, _meta: Metadata, callback: StateStoreVerifyCallback) {
          callback(null, true, JSON.stringify(_req.query));
        },
        store(_req: any, _meta: Metadata, callback: StateStoreStoreCallback) {
          callback(null, JSON.stringify(_req.query));
        },
      },
    });
  }

  async userProfile(accessToken: string, done: (err: Error | null, profile?: KeycloakProfile) => void) {
    const keycloakUrl = process.env.KEYCLOAK_URL;
    const keycloakRealm = process.env.KEYCLOAK_REALM;
    const userInfoUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/userinfo`;

    try {
      const response = await fetch(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return done(new Error('Failed to fetch user profile from Keycloak'));
      }

      const profile = (await response.json()) as KeycloakProfile;
      done(null, profile);
    } catch (err) {
      done(err as Error);
    }
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: KeycloakProfile,
    done: (err: any, data: any) => void
  ) {
    try {
      const parsedState = this.parseState(req);

      const normalizedProfile = {
        name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
        login: profile.preferred_username || profile.email?.split('@')[0] || profile.sub,
        email: profile.email || '',
        avatar_url: profile.picture || '',
        id: profile.sub,
      };

      const response = await this.authService.authenticate(
        'keycloak' as AuthProviderEnum,
        accessToken,
        refreshToken,
        normalizedProfile,
        parsedState?.distinctId,
        {
          origin: parsedState?.source,
          invitationToken: parsedState?.invitationToken,
        }
      );

      done(null, {
        token: response.token,
        newUser: response.newUser,
      });
    } catch (err) {
      done(err, false);
    }
  }

  private parseState(req: any) {
    try {
      return JSON.parse(req.query.state);
    } catch {
      return {};
    }
  }
}
