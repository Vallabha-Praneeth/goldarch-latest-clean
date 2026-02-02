import crypto from 'crypto';

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function base64UrlEncode(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function parseServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not set');
  }
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Service account JSON missing client_email or private_key');
  }
  return parsed;
}

function buildJwtAssertion(serviceAccount: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: GOOGLE_DRIVE_SCOPE,
    aud: serviceAccount.token_uri || GOOGLE_OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  signer.end();

  const signature = signer.sign(serviceAccount.private_key);
  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
}

export async function getDriveAccessToken(): Promise<string> {
  const serviceAccount = parseServiceAccount();
  const assertion = buildJwtAssertion(serviceAccount);

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Drive access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Drive access token missing in response');
  }

  return data.access_token as string;
}
