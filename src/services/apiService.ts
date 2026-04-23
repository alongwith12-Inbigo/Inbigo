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

export async function fetchFromGoogleSheets(apiUrl: string): Promise<VisitorEntry[]> {
  if (!apiUrl) return [];

  const cacheBuster = apiUrl.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
  
  try {
    const response = await fetch(apiUrl + cacheBuster, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data
        .filter(entry => entry && (entry.visitorName || entry.teacherName))
        .map((entry: any) => {
          let rawDate = String(entry.date || '').trim();
          let normalizedDate = rawDate;
          
          // Case 1: ISO String or YYYY-MM-DD HH:mm:ss
          if (rawDate.includes('T') || rawDate.includes(' ')) {
            normalizedDate = rawDate.split(/[T\s]/)[0];
          } 
          // Case 2: Korean style dots (2026. 4. 23.)
          else if (rawDate.includes('.')) {
            const parts = rawDate.split('.').map(p => p.trim()).filter(p => p.length > 0);
            if (parts.length >= 3) {
              normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          }
          // Case 3: Slashes (2026/04/23)
          else if (rawDate.includes('/')) {
            const parts = rawDate.split('/').map(p => p.trim());
            if (parts.length >= 3) {
              normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          }
          
          // Re-validate final format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) && rawDate) {
            console.warn(`Date normalization may have failed for: ${rawDate}`);
          }
          
          return {
            ...entry,
            date: normalizedDate,
            time: String(entry.time || '09:00').substring(0, 5), // Keep HH:mm
            visitorName: String(entry.visitorName || '').trim(),
            teacherName: String(entry.teacherName || '').trim(),
          } as VisitorEntry;
        });
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    return [];
  }
}
