
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Bundle, OperationOutcome, Resource } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

const PAGE_SIZE = 10;

interface UseFhirSearchReturn<T extends Resource> {
  data: T[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
  refresh: () => void;
}

export function useFhirSearch<T extends Resource>(
  resourceType: T['resourceType']
): UseFhirSearchReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  const processBundle = useCallback((bundle: Bundle<T | OperationOutcome>) => {
    const nextLink = bundle.link?.find((link) => link.relation === 'next')?.url ?? null;
    const prevLink = bundle.link?.find((link) => link.relation === 'previous')?.url ?? null;

    setNextPageUrl(nextLink);
    setPrevPageUrl(prevLink);

    const resources =
      bundle.entry
        ?.filter((entry) => entry.resource?.resourceType === resourceType)
        .map((entry) => entry.resource as T) ?? [];

    setData(resources);
  }, [resourceType]);

  const fetchFromUrl = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }
      const bundle = (await response.json()) as Bundle<T | OperationOutcome>;
      if (bundle.resourceType !== 'Bundle') {
        throw new Error(`Unexpected response type: ${bundle.resourceType}`);
      }
      processBundle(bundle);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${resourceType}`;
      console.error(`Error fetching ${resourceType}:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resourceType, processBundle]);

  const buildAndFetchUrl = useCallback((term: string) => {
    let path = `${resourceType}?_count=${PAGE_SIZE}&_sort=-_lastUpdated`;
    if (term) {
      path += `&identifier=${encodeURIComponent(term)}`;
    }
    const fullUrl = getFhirUrl(path);
    if (!initialUrl) {
      setInitialUrl(fullUrl);
    }
    fetchFromUrl(fullUrl);
  }, [resourceType, fetchFromUrl, initialUrl]);

  const debouncedSearch = useMemo(
    () => debounce((term: string) => buildAndFetchUrl(term), 300),
    [buildAndFetchUrl]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const handleNextPage = () => {
    if (nextPageUrl) {
      fetchFromUrl(nextPageUrl);
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      fetchFromUrl(prevPageUrl);
    }
  };

  const refresh = useCallback(() => {
      if(initialUrl) {
        fetchFromUrl(initialUrl);
      }
  }, [fetchFromUrl, initialUrl]);

  return {
    data,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleNextPage,
    handlePrevPage,
    nextPageUrl,
    prevPageUrl,
    refresh,
  };
}
