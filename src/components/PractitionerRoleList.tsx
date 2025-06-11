import { useState, useEffect, useMemo } from 'react';
import type { PractitionerRole, Identifier, Bundle, OperationOutcome, Practitioner } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import { PractitionerPicker } from './PractitionerPicker';

interface PractitionerRoleListProps {
  onSelectPractitionerRole: (practitionerRole: PractitionerRole) => void;
  onCreateNewWithPractitioner?: (practitioner: Practitioner) => void;
}

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
    setPractitionerReference(reference || '');
    setSelectedPractitioner(practitioner);
    setSearchTerm(''); // Clear identifier search when practitioner is selected
  };

  const handleCreateNewForPractitioner = () => {
    if (selectedPractitioner && onCreateNewWithPractitioner) {
      onCreateNewWithPractitioner(selectedPractitioner);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        marginBottom: '1rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Practitioner Search */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold', minWidth: '150px' }}>Filter by Practitioner:</label>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <PractitionerPicker 
              value={practitionerReference}
              onChange={handlePractitionerChange}
              placeholder="Search for a practitioner to filter roles..."
            />
          </div>
          {selectedPractitioner && onCreateNewWithPractitioner && (
            <button
              onClick={handleCreateNewForPractitioner}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Create New Role for this Practitioner
            </button>
          )}
        </div>
        
        {/* Identifier Search (only show when no practitioner is selected) */}
        {!practitionerReference && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', minWidth: '150px' }}>Search by Identifier:</label>
            <input
              type="text"
              placeholder="Search by identifier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                flex: 1,
                maxWidth: '400px'
              }}
            />
            {loading && (
              <span style={{ color: '#666' }}>Searching...</span>
            )}
          </div>
        )}
      </div>
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '1rem',
          backgroundColor: '#fff3f3',
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          margin: '1rem'
        }}>
          Error: {error}
        </div>
      )}
      {practitionerRoles.length === 0 && !loading ? (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          {practitionerReference 
            ? `No practitioner roles found for the selected practitioner${selectedPractitioner ? ` (${selectedPractitioner.name?.[0]?.family || 'Unknown'})` : ''}`
            : searchTerm 
            ? 'No practitioner roles found matching your search' 
            : 'No practitioner roles found'}
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            padding: '1rem'
          }}>
            {practitionerRoles.map((practitionerRole) => (
              <div
                key={practitionerRole.id}
                onClick={() => onSelectPractitionerRole(practitionerRole)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: 'black',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  Role ID: {practitionerRole.id}
                </h3>
                <div style={{ color: '#666' }}>
                  <div>Practitioner: {practitionerRole.practitioner?.reference || 'Not specified'}</div>
                  <div>Organization: {practitionerRole.organization?.reference || 'Not specified'}</div>
                  {practitionerRole.code && practitionerRole.code.length > 0 && (
                    <div>Role: {practitionerRole.code[0].coding?.[0]?.display || practitionerRole.code[0].coding?.[0]?.code || 'Not specified'}</div>
                  )}
                  {practitionerRole.identifier?.map((id: Identifier, index: number) => (
                    <div key={index}>
                      {id.system}: {id.value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {practitionerRoles.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '1rem',
              marginTop: '1rem',
              padding: '1rem',
              borderTop: '1px solid #eee'
            }}>
              <button
                onClick={handlePrevPage}
                disabled={!prevPageUrl || loading}
                style={{
                  opacity: (!prevPageUrl || loading) ? 0.5 : 1,
                  cursor: (!prevPageUrl || loading) ? 'not-allowed' : 'pointer',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white'
                }}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!nextPageUrl || loading}
                style={{
                  opacity: (!nextPageUrl || loading) ? 0.5 : 1,
                  cursor: (!nextPageUrl || loading) ? 'not-allowed' : 'pointer',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 