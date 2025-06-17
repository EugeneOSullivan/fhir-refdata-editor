import { useState, useCallback } from 'react';
import { fhirClient } from '../fhirClient';
import type { FhirResource, SaveHandler } from '../types/fhir';

export function useFhirResource<T extends FhirResource>(resourceType: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<T | null>(null);

  const loadResource = useCallback(async (id: string): Promise<T | null> => {
    if (!id) {
      setError('Please enter an ID');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedResource = await fhirClient.get<T>(`${resourceType}/${id}`);
      setResource(loadedResource);
      return loadedResource;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load resource';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [resourceType]);

  const saveResource: SaveHandler<T> = useCallback(async (resourceData: T): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      let savedResource: T;
      
      if (resourceData.id) {
        // Update existing resource
        savedResource = await fhirClient.put<T>(`${resourceType}/${resourceData.id}`, resourceData);
      } else {
        // Create new resource
        savedResource = await fhirClient.post<T>(resourceType, resourceData);
      }

      setResource(savedResource);
      return savedResource;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save resource';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [resourceType]);

  const clearResource = useCallback(() => {
    setResource(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    resource,
    loading,
    error,
    loadResource,
    saveResource,
    clearResource,
  };
} 