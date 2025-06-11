import { useState, useEffect, useMemo } from 'react';
import type { Organization, Identifier, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

interface OrganizationListProps {
  onSelectOrganization: (organization: Organization) => void;
}

export function OrganizationList({ onSelectOrganization }: OrganizationListProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
        await fetchOrganizations('', 0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Try identifier search first
        const identifierPath = `Organization?_count=${pageSize}&_getpagesoffset=0&_sort=name&identifier=${encodeURIComponent(term)}`;
        const identifierUrl = getFhirUrl(identifierPath);
        const identifierResponse = await fetch(identifierUrl);
        if (!identifierResponse.ok) {
          throw new Error(`Failed to fetch organizations: ${identifierResponse.status} ${identifierResponse.statusText}`);
        }
        const identifierData = await identifierResponse.json();
        let allOrganizations: Organization[] = [];
        let nextLink: string | null = null;
        let prevLink: string | null = null;
        if ('resourceType' in identifierData && identifierData.resourceType === 'Bundle') {
          const bundle = identifierData as Bundle<Organization | OperationOutcome>;
          const identifierOrganizations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Organization')
            .map(entry => entry.resource as Organization) || [];
          allOrganizations = [...identifierOrganizations];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }
        if (allOrganizations.length > 0) {
          setOrganizations(allOrganizations);
          setNextPageUrl(nextLink);
          setPrevPageUrl(prevLink);
          return;
        }
        // If no results by identifier, try name search
        const namePath = `Organization?_count=${pageSize}&_getpagesoffset=0&_sort=name&name=${encodeURIComponent(term)}`;
        const nameUrl = getFhirUrl(namePath);
        const nameResponse = await fetch(nameUrl);
        if (!nameResponse.ok) {
          throw new Error(`Failed to fetch organizations: ${nameResponse.status} ${nameResponse.statusText}`);
        }
        const nameData = await nameResponse.json();
        if ('resourceType' in nameData && nameData.resourceType === 'Bundle') {
          const bundle = nameData as Bundle<Organization | OperationOutcome>;
          const nameOrganizations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Organization')
            .map(entry => entry.resource as Organization) || [];
          allOrganizations = [...nameOrganizations];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }
        setOrganizations(allOrganizations);
        setNextPageUrl(nextLink);
        setPrevPageUrl(prevLink);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
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

  const fetchOrganizations = async (term: string, offset: number) => {
    setLoading(true);
    setError(null);
    try {
      let path = `Organization?_count=${pageSize}&_getpagesoffset=${offset}&_sort=name`;
      if (term) {
        path += `&identifier=${encodeURIComponent(term)}&name=${encodeURIComponent(term)}`;
      }
      const url = getFhirUrl(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
      }
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<Organization | OperationOutcome>;
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);
        const organizations = bundle.entry
          ?.filter(entry => entry.resource?.resourceType === 'Organization')
          .map(entry => entry.resource as Organization) || [];
        setOrganizations(organizations);
        return;
      }
      throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
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
          const bundle = data as Bundle<Organization | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const organizations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Organization')
            .map(entry => entry.resource as Organization) || [];
          setOrganizations(organizations);
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
          const bundle = data as Bundle<Organization | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const organizations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Organization')
            .map(entry => entry.resource as Organization) || [];
          setOrganizations(organizations);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch previous page');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        marginBottom: '1rem',
        padding: '1rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by identifier or name..."
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
        />
        {loading && (
          <span style={{ color: '#666' }}>Searching...</span>
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
      {organizations.length === 0 && !loading ? (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          {searchTerm ? 'No organizations found matching your search' : 'No organizations found'}
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            padding: '1rem'
          }}>
            {organizations.map((organization) => (
              <div
                key={organization.id}
                onClick={() => onSelectOrganization(organization)}
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
                  {organization.name || 'No Name'}
                </h3>
                <div style={{ color: '#666' }}>
                  <div>ID: {organization.id}</div>
                  {organization.identifier?.map((id: Identifier, index: number) => (
                    <div key={index}>
                      {id.system}: {id.value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {organizations.length > 0 && (
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