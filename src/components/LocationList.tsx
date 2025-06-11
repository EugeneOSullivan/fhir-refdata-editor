import { useState, useEffect, useMemo } from 'react';
import type { Location, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

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
  const pageSize = 10;

  // Debounce search term changes
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term) {
        await fetchLocations('', 0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Try name search first
        const namePath = `Location?_count=${pageSize}&_getpagesoffset=0&_sort=name&name=${encodeURIComponent(term)}`;
        const nameUrl = getFhirUrl(namePath);
        const nameResponse = await fetch(nameUrl);
        if (!nameResponse.ok) {
          throw new Error(`Failed to fetch locations: ${nameResponse.status} ${nameResponse.statusText}`);
        }
        const nameData = await nameResponse.json();
        let allLocations: Location[] = [];
        let nextLink: string | null = null;
        let prevLink: string | null = null;
        if ('resourceType' in nameData && nameData.resourceType === 'Bundle') {
          const bundle = nameData as Bundle<Location | OperationOutcome>;
          const nameLocations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Location')
            .map(entry => entry.resource as Location) || [];
          allLocations = [...nameLocations];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }
        setLocations(allLocations);
        setNextPageUrl(nextLink);
        setPrevPageUrl(prevLink);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations');
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const fetchLocations = async (term: string, offset: number) => {
    setLoading(true);
    setError(null);
    try {
      let path = `Location?_count=${pageSize}&_getpagesoffset=${offset}&_sort=name`;
      if (term) {
        path += `&name=${encodeURIComponent(term)}`;
      }
      const url = getFhirUrl(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<Location | OperationOutcome>;
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);
        const locations = bundle.entry
          ?.filter(entry => entry.resource?.resourceType === 'Location')
          .map(entry => entry.resource as Location) || [];
        setLocations(locations);
        return;
      }
      throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = async () => {
    if (nextPageUrl) {
      setLoading(true);
      try {
        const response = await fetch(nextPageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch next page: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if ('resourceType' in data && data.resourceType === 'Bundle') {
          const bundle = data as Bundle<Location | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const locations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Location')
            .map(entry => entry.resource as Location) || [];
          setLocations(locations);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch next page');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevPage = async () => {
    if (prevPageUrl) {
      setLoading(true);
      try {
        const response = await fetch(prevPageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch previous page: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if ('resourceType' in data && data.resourceType === 'Bundle') {
          const bundle = data as Bundle<Location | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const locations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Location')
            .map(entry => entry.resource as Location) || [];
          setLocations(locations);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch previous page');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    const parts = [];
    if (address.line && address.line.length > 0) {
      parts.push(address.line.join(', '));
    }
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.join(', ');
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            outline: 'none',
            transition: 'border-color 0.15s ease-in-out'
          }}
          onFocus={(e) => e.target.style.borderColor = '#86b7fe'}
          onBlur={(e) => e.target.style.borderColor = '#ced4da'}
        />
      </div>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          margin: '1rem 0'
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#6c757d'
        }}>
          Loading locations...
        </div>
      )}

      {!loading && locations.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#6c757d',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          No locations found.
        </div>
      )}

      {!loading && locations.length > 0 && (
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 2fr 100px',
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            fontWeight: 'bold',
            color: '#495057'
          }}>
            <div>Name</div>
            <div>Status</div>
            <div>Type</div>
            <div>Address</div>
            <div>Action</div>
          </div>
          
          {locations.map((location) => (
            <div
              key={location.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 2fr 100px',
                gap: '1rem',
                padding: '1rem',
                borderBottom: '1px solid #e9ecef',
                transition: 'background-color 0.15s ease-in-out'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ fontWeight: '500' }}>
                {location.name || 'N/A'}
                {location.description && (
                  <div style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.25rem' }}>
                    {location.description}
                  </div>
                )}
              </div>
              <div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: location.status === 'active' ? '#d4edda' : 
                                 location.status === 'inactive' ? '#f8d7da' : '#fff3cd',
                  color: location.status === 'active' ? '#155724' : 
                         location.status === 'inactive' ? '#721c24' : '#856404'
                }}>
                  {location.status || 'N/A'}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {location.type?.[0]?.coding?.[0]?.display || 
                 location.type?.[0]?.coding?.[0]?.code || 'N/A'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                {formatAddress(location.address) || 'N/A'}
              </div>
              <div>
                <button
                  onClick={() => onSelectLocation(location)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid #007bff',
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0056b3';
                    e.currentTarget.style.borderColor = '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#007bff';
                    e.currentTarget.style.borderColor = '#007bff';
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(nextPageUrl || prevPageUrl) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={handlePrevPage}
            disabled={!prevPageUrl || loading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #6c757d',
              backgroundColor: prevPageUrl && !loading ? '#6c757d' : '#e9ecef',
              color: prevPageUrl && !loading ? 'white' : '#6c757d',
              cursor: prevPageUrl && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!nextPageUrl || loading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid #6c757d',
              backgroundColor: nextPageUrl && !loading ? '#6c757d' : '#e9ecef',
              color: nextPageUrl && !loading ? 'white' : '#6c757d',
              cursor: nextPageUrl && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 