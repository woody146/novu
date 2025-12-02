import styled from '@emotion/styled';
import { Divider, Button as MantineButton } from '@mantine/core';

import { colors, GitHub, Text } from '@novu/design-system';

import { PropsWithChildren, useEffect, useState } from 'react';
import { When } from '../../../components/utils/When';
import { API_ROOT, IS_SELF_HOSTED } from '../../../config';
import { buildGithubLink } from './gitHubUtils';
import { buildKeycloakLink } from './keycloakUtils';

// Simple Keycloak icon component
function KeycloakIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <circle cx="128" cy="128" r="110" fill="#008aaa" />
      <path d="M128 50 L170 110 L128 110 L128 206 L86 146 L128 146 Z" fill="white" />
    </svg>
  );
}

export function OAuth({
  invitationToken,
  isLoginPage = false,
}: {
  invitationToken?: string | undefined;
  isLoginPage?: boolean;
}) {
  const githubLink = buildGithubLink({ invitationToken, isLoginPage });
  const keycloakLink = buildKeycloakLink({ invitationToken, isLoginPage });
  const [isKeycloakEnabled, setIsKeycloakEnabled] = useState(false);

  useEffect(() => {
    // Check if Keycloak is configured
    fetch(`${API_ROOT}/v1/auth/keycloak`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data.success) {
          setIsKeycloakEnabled(true);
        }
      })
      .catch(() => {
        // Keycloak not configured
        setIsKeycloakEnabled(false);
      });
  }, []);

  const showOAuth = !IS_SELF_HOSTED || isKeycloakEnabled;

  return (
    <When truthy={showOAuth}>
      <div>
        <Container>
          <When truthy={!IS_SELF_HOSTED}>
            <OAuthButton
              component="a"
              href={githubLink}
              my={30}
              variant="white"
              fullWidth
              radius="md"
              leftIcon={<GitHub />}
              sx={{ color: colors.B40, fontSize: '16px', fontWeight: 700, height: '50px', marginRight: 10 }}
              data-test-id="github-button"
            >
              Sign In with GitHub
            </OAuthButton>
          </When>
          <When truthy={isKeycloakEnabled}>
            <OAuthButton
              component="a"
              href={keycloakLink}
              my={30}
              variant="white"
              fullWidth
              radius="md"
              leftIcon={<KeycloakIcon />}
              sx={{
                color: colors.B40,
                fontSize: '16px',
                fontWeight: 700,
                height: '50px',
                marginLeft: !IS_SELF_HOSTED ? 10 : 0,
              }}
              data-test-id="keycloak-button"
            >
              Sign In with Keycloak
            </OAuthButton>
          </When>
        </Container>
        <Divider label={<Text color={colors.B40}>Or</Text>} color={colors.B30} labelPosition="center" my="md" />
      </div>
    </When>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: space-between;
`;

const OAuthButton = styled(MantineButton)<
  PropsWithChildren<{
    component: 'a';
    my: number;
    href: string;
    variant: 'white';
    fullWidth: boolean;
    radius: 'md';
    leftIcon: any;
    sx: any;
  }>
>`
  :hover {
    color: ${colors.B40};
  }
`;
