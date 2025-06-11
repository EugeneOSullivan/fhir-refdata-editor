// src/fhirClient.ts

// Helper function to construct FHIR API URLs
export function getFhirUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Use the proxied path
  return `/fhir/${cleanPath}`;
}

// Helper function to make FHIR API calls
export async function fetchFhir<T>(path: string, options?: RequestInit): Promise<T> {
  const url = getFhirUrl(path);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FHIR API error: ${response.status} ${response.statusText} - ${text}`);
  }
  
  return response.json();
}

// Common FHIR operations
export const fhirClient = {
  get: <T>(path: string) => fetchFhir<T>(path),
  put: <T>(path: string, data: object) => fetchFhir<T>(path, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  post: <T>(path: string, data: object) => fetchFhir<T>(path, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: <T>(path: string) => fetchFhir<T>(path, {
    method: 'DELETE'
  })
};
