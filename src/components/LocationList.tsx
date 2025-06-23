import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Location, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import '../styles/components.css';

interface LocationListProps {
  onSelectLocation: (location: Location) => void;
}

export function LocationList({ onSelectLocation }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const pageSize = 20;
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized formatting functions to prevent recalculation on every render
  const formatAddress = useCallback((address: any) => {
    if (!address) return 'No address provided';
    
    const parts = [];
    if (address.line && address.line.length > 0) {
      parts.push(address.line.join(', '));
    }
    
    const cityParts = [];
    if (address.city) cityParts.push(address.city);
    if (address.state) cityParts.push(address.state);
    if (address.postalCode) cityParts.push(address.postalCode);
    
    if (cityParts.length > 0) {
      parts.push(cityParts.join(', '));
    }
    
    if (address.country) {
      parts.push(address.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No address details';
  }, []);

  const formatType = useCallback((types: any[] | undefined) => {
    if (!types || types.length === 0) return 'Not specified';
    const type = types[0];
    if (type.coding && type.coding.length > 0) {
      return type.coding[0].display || type.coding[0].code || 'Unknown';
    }
    return 'Not specified';
  }, []);

  // Consolidated bundle parsing logic
  const parseBundleResponse = useCallback((data: unknown): { locations: Location[], nextLink: string | null, prevLink: string | null } => {
    if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
      const bundle = data as Bundle<Location | OperationOutcome>;
      const nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
      const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
      const locations = bundle.entry
        ?.filter(entry => entry.resource?.resourceType === 'Location')
        .map(entry => entry.resource as Location) || [];
      return { locations, nextLink, prevLink };
    }
    throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
  }, []);

  // Consolidated fetch function with request cancellation
  const fetchLocations = useCallback(async (term: string, offset: number, url?: string) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      let requestUrl: string;
      
      if (url) {
        requestUrl = url;
      } else {
        let path = `Location?_count=${pageSize}&_getpagesoffset=${offset}&_sort=name`;
        if (term) {
          path += `&name=${encodeURIComponent(term)}`;
        }
        requestUrl = getFhirUrl(path);
      }

      const response = await fetch(requestUrl, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }
      
      const data: unknown = await response.json();
      const { locations, nextLink, prevLink } = parseBundleResponse(data);
      
      setLocations(locations);
      setNextPageUrl(nextLink);
      setPrevPageUrl(prevLink);
    } catch (err) {
      // Don't set error if request was cancelled
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [pageSize, parseBundleResponse]);

  // Debounced search with improved logic
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term) {
        await fetchLocations('', 0);
        return;
      }
      await fetchLocations(term, 0);
    }, 200),
    [fetchLocations]
  );

  // Initial data fetch on component mount
  useEffect(() => {
    fetchLocations('', 0);
  }, [fetchLocations]);

  // Search effect
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleNextPage = useCallback(async () => {
    if (nextPageUrl) {
      setPaginationLoading(true);
      try {
        await fetchLocations('', 0, nextPageUrl);
      } finally {
        setPaginationLoading(false);
      }
    }
  }, [nextPageUrl, fetchLocations]);

  const handlePrevPage = useCallback(async () => {
    if (prevPageUrl) {
      setPaginationLoading(true);
      try {
        await fetchLocations('', 0, prevPageUrl);
      } finally {
        setPaginationLoading(false);
      }
    }
  }, [prevPageUrl, fetchLocations]);

  // Memoized table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    return locations.map((location) => (
      <tr key={location.id} className="fhir-table-row">
        <td className="fhir-table-cell">{location.name || 'Unnamed'}</td>
        <td className="fhir-table-cell">{formatType(location.type)}</td>
        <td className="fhir-table-cell">{formatAddress(location.address)}</td>
        <td className="fhir-table-cell">
          <span className={`fhir-badge ${location.status === 'active' ? 'fhir-badge-active' : location.status === 'suspended' ? 'fhir-badge-suspended' : 'fhir-badge-inactive'}`}>
            {location.status || 'inactive'}
          </span>
        </td>
        <td className="fhir-table-cell">
          <button 
            className="fhir-btn fhir-btn-success"
            onClick={() => onSelectLocation(location)}
          >
            Select
          </button>
        </td>
      </tr>
    ));
  }, [locations, formatType, formatAddress, onSelectLocation]);

  // Memoized skeleton loading rows
  const skeletonRows = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => (
      <tr key={`skeleton-${index}`} className="fhir-table-row">
        <td className="fhir-table-cell">
          <div className="fhir-skeleton fhir-skeleton-cell-large"></div>
        </td>
        <td className="fhir-table-cell">
          <div className="fhir-skeleton fhir-skeleton-cell"></div>
        </td>
        <td className="fhir-table-cell">
          <div className="fhir-skeleton fhir-skeleton-cell-large"></div>
        </td>
        <td className="fhir-table-cell">
          <div className="fhir-skeleton fhir-skeleton-cell-small"></div>
        </td>
        <td className="fhir-table-cell">
          <div className="fhir-skeleton fhir-skeleton-cell-small"></div>
        </td>
      </tr>
    ));
  }, []);

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Locations</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="fhir-search-input"
              disabled={loading}
            />
            {loading && (
              <div 
                style={{ 
                  position: 'absolute', 
                  right: '12px',
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid var(--fhir-primary-color)',
                  borderRadius: '50%',
                  animation: 'fhir-spin 1s linear infinite'
                }}
              />
            )}
          </div>
        </div>

        {error && <div className="fhir-error">{error}</div>}

        <table className={`fhir-table ${loading ? 'fhir-table-loading' : ''}`}>
          <thead>
            <tr>
              <th className="fhir-table-header">Name</th>
              <th className="fhir-table-header">Type</th>
              <th className="fhir-table-header">Address</th>
              <th className="fhir-table-header">Status</th>
              <th className="fhir-table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(loading || initialLoading) ? skeletonRows : tableRows}
          </tbody>
        </table>

        {!loading && !initialLoading && locations.length === 0 && (
          <div className="fhir-empty">No locations found</div>
        )}

        {locations.length > 0 && !initialLoading && (
          <div className="fhir-section-spacing" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className={`fhir-btn fhir-btn-secondary ${paginationLoading ? 'fhir-btn-loading' : ''}`}
              onClick={handlePrevPage}
              disabled={!prevPageUrl || paginationLoading}
            >
              {paginationLoading ? 'Loading...' : 'Previous'}
            </button>
            <button 
              className={`fhir-btn fhir-btn-secondary ${paginationLoading ? 'fhir-btn-loading' : ''}`}
              onClick={handleNextPage}
              disabled={!nextPageUrl || paginationLoading}
            >
              {paginationLoading ? 'Loading...' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 