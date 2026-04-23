import { supabase } from './supabase';

export class DriveAuthError extends Error {
  constructor() { super('Google Drive access expired. Please sign in again.'); }
}

export async function getDriveToken(): Promise<string | null> {
  // Try chrome.storage first (persisted at sign-in)
  const stored = await new Promise<string | null>(resolve => {
    chrome.storage.local.get('google_drive_token', (r) => {
      resolve((r.google_drive_token as string) || null);
    });
  });
  if (stored) return stored;

  // Fall back to live Supabase session provider_token
  const { data: { session } } = await supabase.auth.getSession();
  return session?.provider_token ?? null;
}

export async function hasDriveAccess(): Promise<boolean> {
  const token = await getDriveToken();
  return !!token;
}

export async function createGoogleDoc(htmlContent: string, title: string): Promise<void> {
  const token = await getDriveToken();
  if (!token) throw new DriveAuthError();

  const boundary = 'jobfit_boundary_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({
    name: title,
    mimeType: 'application/vnd.google-apps.document',
  });

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlContent,
    `--${boundary}--`,
  ].join('\r\n');

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (response.status === 401) throw new DriveAuthError();

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive API error ${response.status}`);
  }

  const data = await response.json();
  const url = data.webViewLink;
  if (url) {
    chrome.tabs.create({ url });
  } else {
    throw new Error('Google Drive did not return a document URL');
  }
}
