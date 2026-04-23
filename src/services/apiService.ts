/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisitorEntry } from '../components/VisitorList';

export async function sendToGoogleSheets(apiUrl: string, entries: VisitorEntry | VisitorEntry[]) {
  if (!apiUrl) return;

  const payload = Array.isArray(entries) ? entries : [entries];

  try {
    // Send as plain text to avoid preflight issues in some environments
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error('Failed to send to Google Sheets:', error);
    throw error;
  }
}
