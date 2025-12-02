import { SignUpOriginEnum } from '@novu/shared';
import { API_HOSTNAME } from '../../config';

export const buildKeycloakLink = ({
  invitationToken,
  isLoginPage,
}: {
  invitationToken?: string;
  isLoginPage?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append('source', SignUpOriginEnum.WEB);
  if (invitationToken) {
    queryParams.append('invitationToken', invitationToken);
  }
  if (isLoginPage) {
    queryParams.append('isLoginPage', 'true');
  }

  return `${API_HOSTNAME}/v1/auth/keycloak/auth?${queryParams.toString()}`;
};

export const checkKeycloakEnabled = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_HOSTNAME}/v1/auth/keycloak`);
    const data = await response.json();

    return data.data?.success === true;
  } catch {
    return false;
  }
};
