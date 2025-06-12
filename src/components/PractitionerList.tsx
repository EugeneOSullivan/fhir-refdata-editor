import { useState, useEffect, useMemo } from 'react';
import type { Practitioner, Identifier, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

interface PractitionerListProps {
  onSelectPractitioner: (practitioner: Practitioner) => void;
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

export function PractitionerList({ onSelectPractitioner }: PractitionerListProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
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
        await fetchPractitioners('', 0);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Try identifier search first
        const identifierPath = `Practitioner?_count=${pageSize}&_getpagesoffset=0&_sort=name&identifier=${encodeURIComponent(term)}`;
        const identifierUrl = getFhirUrl(identifierPath);
        
        const identifierResponse = await fetch(identifierUrl);
        if (!identifierResponse.ok) {
          throw new Error(`Failed to fetch practitioners: ${identifierResponse.status} ${identifierResponse.statusText}`);
        }
        
        const identifierData = await identifierResponse.json();
        let allPractitioners: Practitioner[] = [];
        let nextLink: string | null = null;
        let prevLink: string | null = null;

        if ('resourceType' in identifierData && identifierData.resourceType === 'Bundle') {
          const bundle = identifierData as Bundle<Practitioner | OperationOutcome>;
          const identifierPractitioners = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Practitioner')
            .map(entry => entry.resource as Practitioner) || [];
          
          allPractitioners = [...identifierPractitioners];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }

        // If we found results by identifier, use those
        if (allPractitioners.length > 0) {
          setPractitioners(allPractitioners);
          setNextPageUrl(nextLink);
          setPrevPageUrl(prevLink);
          return;
        }

        // If no results by identifier, try family name search
        const familyPath = `Practitioner?_count=${pageSize}&_getpagesoffset=0&_sort=name&family=${encodeURIComponent(term)}`;
        const familyUrl = getFhirUrl(familyPath);
        
        const familyResponse = await fetch(familyUrl);
        if (!familyResponse.ok) {
          throw new Error(`Failed to fetch practitioners: ${familyResponse.status} ${familyResponse.statusText}`);
        }
        
        const familyData = await familyResponse.json();
        if ('resourceType' in familyData && familyData.resourceType === 'Bundle') {
          const bundle = familyData as Bundle<Practitioner | OperationOutcome>;
          const familyPractitioners = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Practitioner')
            .map(entry => entry.resource as Practitioner) || [];
          
          allPractitioners = [...familyPractitioners];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }

        setPractitioners(allPractitioners);
        setNextPageUrl(nextLink);
        setPrevPageUrl(prevLink);
      } catch (err) {
        console.error('Error fetching practitioners:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch practitioners');
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

  const fetchPractitioners = async (term: string, offset: number) => {
    setLoading(true);
    setError(null);
    try {
      let path = `Practitioner?_count=${pageSize}&_getpagesoffset=${offset}&_sort=name`;
      
      if (term) {
        path += `&identifier=${encodeURIComponent(term)}&family=${encodeURIComponent(term)}&given=${encodeURIComponent(term)}`;
      }

      const url = getFhirUrl(path);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch practitioners: ${response.status} ${response.statusText}`);
      }

      const data: unknown = await response.json();

      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<Practitioner | OperationOutcome>;
        
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);

        const practitioners = bundle.entry
          ?.filter(entry => entry.resource?.resourceType === 'Practitioner')
          .map(entry => entry.resource as Practitioner) || [];

        setPractitioners(practitioners);
        return;
      }

      throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
    } catch (err) {
      console.error('Error fetching practitioners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch practitioners');
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
          const bundle = data as Bundle<Practitioner | OperationOutcome>;
          
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);

          const practitioners = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Practitioner')
            .map(entry => entry.resource as Practitioner) || [];

          setPractitioners(practitioners);
        }
      } catch (err) {
        console.error('Error fetching next page:', err);
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
          const bundle = data as Bundle<Practitioner | OperationOutcome>;
          
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);

          const practitioners = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Practitioner')
            .map(entry => entry.resource as Practitioner) || [];

          setPractitioners(practitioners);
        }
      } catch (err) {
        console.error('Error fetching previous page:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch previous page');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatName = (practitioner: Practitioner) => {
    if (!practitioner.name || practitioner.name.length === 0) return 'Unknown';
    const name = practitioner.name[0];
    const parts = [];
    if (name.given) parts.push(name.given.join(' '));
    if (name.family) parts.push(name.family);
    return parts.join(' ') || 'Unknown';
  };

  const formatIdentifiers = (identifiers: Identifier[] | undefined) => {
    if (!identifiers || identifiers.length === 0) return 'None';
    return identifiers
      .map(id => `${id.system || 'N/A'}: ${id.value || 'N/A'}`)
      .join(', ');
  };

  return (
    <div style={containerStyle}>
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Search by identifier or family name..."
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
          Loading practitioners...
        </div>
      ) : practitioners.length === 0 ? (
        <div style={emptyStyle}>
          No practitioners found.
        </div>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Identifiers</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Birth Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {practitioners.map((practitioner, index) => (
                <tr key={practitioner.id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                  <td style={tdStyle}>
                    <strong>{formatName(practitioner)}</strong>
                  </td>
                  <td style={tdStyle}>
                    <small style={{ color: '#6c757d' }}>{formatIdentifiers(practitioner.identifier)}</small>
                  </td>
                  <td style={tdStyle}>
                    {practitioner.gender || 'N/A'}
                  </td>
                  <td style={tdStyle}>
                    {practitioner.birthDate || 'N/A'}
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={buttonStyle}
                      onClick={() => onSelectPractitioner(practitioner)}
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
              {practitioners.length} practitioners
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