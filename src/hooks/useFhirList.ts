import { useState, useCallback, useEffect } from 'react';
import { fhirClient } from '../fhirClient';
import type { FhirResource, FhirBundle, ListState } from '../types/fhir';

export function useFhirList<T extends FhirResource>(resourceType: string) {
  const [state, setState] = useState<ListState<T>>({
    items: [],
    loading: false,
    error: null,
    searchTerm: '',
    nextPageUrl: null,
    prevPageUrl: null,
  });

  const searchResources = useCallback(async (searchTerm: string = '', url?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let searchUrl: string;
      
      if (url) {
        // Use provided URL for pagination
        searchUrl = url;
      } else {
        // Build search URL
        const params = new URLSearchParams();
        if (searchTerm) {
          params.append('_text', searchTerm);
        }
        params.append('_count', '20');
        searchUrl = `${resourceType}?${params.toString()}`;
      }

      const bundle = await fhirClient.get<FhirBundle<T>>(searchUrl);
      
      setState(prev => ({
        ...prev,
        items: bundle.entry?.map(entry => entry.resource as T) || [],
        loading: false,
        searchTerm,
        nextPageUrl: bundle.link?.find(link => link.relation === 'next')?.url || null,
        prevPageUrl: bundle.link?.find(link => link.relation === 'previous')?.url || null,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load resources';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [resourceType]);

  const handleSearch = useCallback((searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
    searchResources(searchTerm);
  }, [searchResources]);

  const handleNextPage = useCallback(() => {
    if (state.nextPageUrl) {
      searchResources(state.searchTerm, state.nextPageUrl);
    }
  }, [state.nextPageUrl, state.searchTerm, searchResources]);

  const handlePrevPage = useCallback(() => {
    if (state.prevPageUrl) {
      searchResources(state.searchTerm, state.prevPageUrl);
    }
  }, [state.prevPageUrl, state.searchTerm, searchResources]);

  // Initial load
  useEffect(() => {
    searchResources();
  }, [searchResources]);

  return {
    ...state,
    searchResources,
    handleSearch,
    handleNextPage,
    handlePrevPage,
  };
} 