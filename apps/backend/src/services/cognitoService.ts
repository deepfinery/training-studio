import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { env } from '../config/env';

const cognito = new CognitoIdentityProviderClient({ region: env.AWS_REGION });

export async function registerUser(email: string, password: string, name?: string) {
  if (!env.COGNITO_CLIENT_ID) {
    throw new Error('Cognito client id is not configured');
  }

  const command = new SignUpCommand({
    ClientId: env.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      ...(name ? [{ Name: 'name', Value: name }] : [])
    ]
  });

  return cognito.send(command);
}

export async function loginUser(email: string, password: string) {
  if (!env.COGNITO_CLIENT_ID) {
    throw new Error('Cognito client id is not configured');
  }

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  const response = await cognito.send(command);
  return response.AuthenticationResult;
}

export function googleSsoUrl(redirectUri?: string) {
  if (!env.COGNITO_DOMAIN || !env.COGNITO_CLIENT_ID) {
    throw new Error('Cognito domain or client id missing');
  }

  const redirect = encodeURIComponent(redirectUri ?? env.COGNITO_REDIRECT_URI);
  const domain = env.COGNITO_DOMAIN.startsWith('https://')
    ? env.COGNITO_DOMAIN
    : `https://${env.COGNITO_DOMAIN}`;

  const idp = encodeURIComponent(env.COGNITO_GOOGLE_IDP);
  return `${domain}/oauth2/authorize?response_type=code&client_id=${env.COGNITO_CLIENT_ID}&redirect_uri=${redirect}&identity_provider=${idp}&scope=openid+email+profile`;
}

export async function exchangeAuthCode(code: string, redirectUri?: string) {
  if (!env.COGNITO_DOMAIN || !env.COGNITO_CLIENT_ID) {
    throw new Error('Cognito domain or client id missing');
  }

  const domain = env.COGNITO_DOMAIN.startsWith('https://')
    ? env.COGNITO_DOMAIN
    : `https://${env.COGNITO_DOMAIN}`;

  const res = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.COGNITO_CLIENT_ID,
      code,
      redirect_uri: redirectUri ?? env.COGNITO_REDIRECT_URI
    }).toString()
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Failed to exchange code: ${message}`);
  }

  return res.json();
}
