import { useState, useEffect, useMemo } from 'react';
import type { Location, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

interface LocationListProps {
  onSelectLocation: (location: Location) => void;
}

// Shared styles for consistent design
const containerStyle = {
  maxWidth: 'none',
  width: '95%',
  margin: '0 auto',
  padding: '2rem',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
};

const searchContainerStyle = {
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e9ecef'
};

const searchInputStyle = {
  width: '100%',
  padding: '0.75rem',
  fontSize: '1rem',
  borderRadius: '6px',
  border: '1px solid #ced4da',
  outline: 'none',
  transition: 'all 0.15s ease-in-out'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  backgroundColor: 'white',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
};

const thStyle = {
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  textAlign: 'left' as const,
  fontWeight: '600',
  color: '#495057',
  borderBottom: '2px solid #e9ecef'
};

const tdStyle = {
  padding: '1rem',
  borderBottom: '1px solid #e9ecef',
  verticalAlign: 'top' as const
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  backgroundColor: '#007bff',
  color: 'white'
};

const paginationStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '2rem',
  padding: '1rem 0'
};

const errorStyle = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '1rem',
  borderRadius: '6px',
  border: '1px solid #f5c6cb',
  marginBottom: '1.5rem'
};

const loadingStyle = {
  textAlign: 'center' as const,
  padding: '3rem',
  color: '#6c757d',
  fontSize: '1.1rem'
};

const emptyStyle = {
  textAlign: 'center' as const,
  padding: '3rem',
  color: '#6c757d',
  fontSize: '1rem'
};

const badgeStyle = {
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: '500',
  borderRadius: '4px',
  textTransform: 'uppercase' as const
};

const getStatusBadgeColor = (status: string | undefined) => {
  switch (status) {
    case 'active':
      return { backgroundColor: '#d4edda', color: '#155724' };
    case 'inactive':
      return { backgroundColor: '#f8d7da', color: '#721c24' };
    case 'suspended':
      return { backgroundColor: '#fff3cd', color: '#856404' };
    default:
      return { backgroundColor: '#e2e3e5', color: '#6c757d' };
  }
};

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
    if (!address) return 'N/A';
    const parts = [];
    if (address.line && address.line.length > 0) {
      parts.push(address.line.join(', '));
    }
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.join(', ') || 'N/A';
  };

  const formatType = (types: any[] | undefined) => {
    if (!types || types.length === 0) return 'N/A';
    return types
      .map(type => type.coding?.[0]?.display || type.text || 'Unknown')
      .join(', ');
  };

  return (
    <div style={containerStyle}>
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
          onFocus={(e) => e.target.style.borderColor = '#007bff'}
          onBlur={(e) => e.target.style.borderColor = '#ced4da'}
        />
      </div>

      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={loadingStyle}>
          Loading locations...
        </div>
      ) : locations.length === 0 ? (
        <div style={emptyStyle}>
          No locations found.
        </div>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, index) => (
                <tr key={location.id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                  <td style={tdStyle}>
                    <strong>{location.name || 'Unnamed Location'}</strong>
                  </td>
                  <td style={tdStyle}>
                    <span style={{...badgeStyle, ...getStatusBadgeColor(location.status)}}>
                      {location.status || 'Unknown'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {formatType(location.type)}
                  </td>
                  <td style={tdStyle}>
                    <small style={{ color: '#6c757d' }}>{formatAddress(location.address)}</small>
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={buttonStyle}
                      onClick={() => onSelectLocation(location)}
                      onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3'}
                      onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#007bff'}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={paginationStyle}>
            <button
              style={{
                ...buttonStyle,
                backgroundColor: prevPageUrl ? '#6c757d' : '#e9ecef',
                color: prevPageUrl ? 'white' : '#adb5bd',
                cursor: prevPageUrl ? 'pointer' : 'not-allowed'
              }}
              onClick={handlePrevPage}
              disabled={!prevPageUrl}
            >
              Previous
            </button>
            
            <span style={{ color: '#6c757d' }}>
              {locations.length} locations
            </span>
            
            <button
              style={{
                ...buttonStyle,
                backgroundColor: nextPageUrl ? '#6c757d' : '#e9ecef',
                color: nextPageUrl ? 'white' : '#adb5bd',
                cursor: nextPageUrl ? 'pointer' : 'not-allowed'
              }}
              onClick={handleNextPage}
              disabled={!nextPageUrl}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
} 