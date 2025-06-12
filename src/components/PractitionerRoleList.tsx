import { useState, useEffect, useMemo } from 'react';
import type { PractitionerRole, Bundle, OperationOutcome, Practitioner } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import { PractitionerPicker } from './PractitionerPicker';

interface PractitionerRoleListProps {
  onSelectPractitionerRole: (practitionerRole: PractitionerRole) => void;
  onCreateNewWithPractitioner?: (practitioner: Practitioner) => void;
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

const createButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#28a745',
  marginLeft: '0.5rem'
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

const filtersStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1rem',
  alignItems: 'center',
  flexWrap: 'wrap' as const
};

export function PractitionerRoleList({ onSelectPractitionerRole, onCreateNewWithPractitioner }: PractitionerRoleListProps) {
  const [practitionerRoles, setPractitionerRoles] = useState<PractitionerRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | undefined>();
  const [practitionerReference, setPractitionerReference] = useState<string>('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const pageSize = 10;

  // Effect to search by practitioner reference
  useEffect(() => {
    if (practitionerReference) {
      fetchPractitionerRolesByPractitioner(practitionerReference, 0);
    } else {
      fetchPractitionerRoles('', 0);
    }
  }, [practitionerReference]);

  // Debounce search term changes (for identifier search)
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term) {
        if (!practitionerReference) {
          await fetchPractitionerRoles('', 0);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Try identifier search first
        const identifierPath = `PractitionerRole?_count=${pageSize}&_getpagesoffset=0&identifier=${encodeURIComponent(term)}`;
        const identifierUrl = getFhirUrl(identifierPath);
        const identifierResponse = await fetch(identifierUrl);
        if (!identifierResponse.ok) {
          throw new Error(`Failed to fetch practitioner roles: ${identifierResponse.status} ${identifierResponse.statusText}`);
        }
        const identifierData = await identifierResponse.json();
        let allPractitionerRoles: PractitionerRole[] = [];
        let nextLink: string | null = null;
        let prevLink: string | null = null;
        if ('resourceType' in identifierData && identifierData.resourceType === 'Bundle') {
          const bundle = identifierData as Bundle<PractitionerRole | OperationOutcome>;
          const identifierPractitionerRoles = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'PractitionerRole')
            .map(entry => entry.resource as PractitionerRole) || [];
          allPractitionerRoles = [...identifierPractitionerRoles];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }
        setPractitionerRoles(allPractitionerRoles);
        setNextPageUrl(nextLink);
        setPrevPageUrl(prevLink);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch practitioner roles');
      } finally {
        setLoading(false);
      }
    }, 300),
    [practitionerReference]
  );

  useEffect(() => {
    if (!practitionerReference) {
      debouncedSearch(searchTerm);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch, practitionerReference]);

  const fetchPractitionerRoles = async (term: string, offset: number) => {
    setLoading(true);
    setError(null);
    try {
      let path = `PractitionerRole?_count=${pageSize}&_getpagesoffset=${offset}`;
      if (term) {
        path += `&identifier=${encodeURIComponent(term)}`;
      }
      const url = getFhirUrl(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch practitioner roles: ${response.status} ${response.statusText}`);
      }
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<PractitionerRole | OperationOutcome>;
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);
        const practitionerRoles = bundle.entry
          ?.filter(entry => entry.resource?.resourceType === 'PractitionerRole')
          .map(entry => entry.resource as PractitionerRole) || [];
        setPractitionerRoles(practitionerRoles);
        return;
      }
      throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch practitioner roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPractitionerRolesByPractitioner = async (practitionerRef: string, offset: number) => {
    setLoading(true);
    setError(null);
    try {
      let path = `PractitionerRole?_count=${pageSize}&_getpagesoffset=${offset}&practitioner=${encodeURIComponent(practitionerRef)}`;
      const url = getFhirUrl(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch practitioner roles: ${response.status} ${response.statusText}`);
      }
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<PractitionerRole | OperationOutcome>;
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);
        const practitionerRoles = bundle.entry
          ?.filter(entry => entry.resource?.resourceType === 'PractitionerRole')
          .map(entry => entry.resource as PractitionerRole) || [];
        setPractitionerRoles(practitionerRoles);
        return;
      }
      throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch practitioner roles');
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
          const bundle = data as Bundle<PractitionerRole | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const practitionerRoles = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'PractitionerRole')
            .map(entry => entry.resource as PractitionerRole) || [];
          setPractitionerRoles(practitionerRoles);
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
          const bundle = data as Bundle<PractitionerRole | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const practitionerRoles = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'PractitionerRole')
            .map(entry => entry.resource as PractitionerRole) || [];
          setPractitionerRoles(practitionerRoles);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch previous page');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePractitionerChange = (reference: string | undefined, practitioner: Practitioner | undefined) => {
    setSelectedPractitioner(practitioner);
    setPractitionerReference(reference || '');
    setSearchTerm(''); // Clear search when filtering by practitioner
  };

  const handleCreateNewForPractitioner = () => {
    if (selectedPractitioner && onCreateNewWithPractitioner) {
      onCreateNewWithPractitioner(selectedPractitioner);
    }
  };



  const formatCodes = (codes: any[] | undefined) => {
    if (!codes || codes.length === 0) return 'N/A';
    return codes
      .map(code => code.coding?.[0]?.display || code.text || 'Unknown')
      .join(', ');
  };

  const formatPractitionerName = (practitionerRef: string | undefined) => {
    if (!practitionerRef) return 'N/A';
    // Extract ID from reference
    const id = practitionerRef.split('/').pop();
    return `Practitioner/${id}`;
  };

  return (
    <div style={containerStyle}>
      <div style={searchContainerStyle}>
        <div style={filtersStyle}>
          <div style={{ flex: 1 }}>
            <PractitionerPicker
              value={practitionerReference}
              onChange={handlePractitionerChange}
              placeholder="Filter by practitioner..."
            />
          </div>
          {selectedPractitioner && onCreateNewWithPractitioner && (
            <button
              style={createButtonStyle}
              onClick={handleCreateNewForPractitioner}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1e7e34'}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
            >
              Create Role for {selectedPractitioner.name?.[0]?.family || 'Practitioner'}
            </button>
          )}
        </div>

        {!practitionerReference && (
          <input
            type="text"
            placeholder="Search by identifier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        )}
      </div>

      {error && (
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={loadingStyle}>
          Loading practitioner roles...
        </div>
      ) : practitionerRoles.length === 0 ? (
        <div style={emptyStyle}>
          No practitioner roles found.
        </div>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Practitioner</th>
                <th style={thStyle}>Codes</th>
                <th style={thStyle}>Specialties</th>
                <th style={thStyle}>Organization</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {practitionerRoles.map((role, index) => (
                <tr key={role.id || index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                  <td style={tdStyle}>
                    <strong>{formatPractitionerName(role.practitioner?.reference)}</strong>
                  </td>
                  <td style={tdStyle}>
                    {formatCodes(role.code)}
                  </td>
                  <td style={tdStyle}>
                    {formatCodes(role.specialty)}
                  </td>
                  <td style={tdStyle}>
                    <small style={{ color: '#6c757d' }}>
                      {role.organization?.reference ? 
                        role.organization.reference.split('/').pop() : 'N/A'}
                    </small>
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={buttonStyle}
                      onClick={() => onSelectPractitionerRole(role)}
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
              {practitionerRoles.length} practitioner roles
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