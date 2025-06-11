import { useState, useEffect, useMemo } from 'react';
import type { Practitioner, Identifier, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

interface PractitionerListProps {
  onSelectPractitioner: (practitioner: Practitioner) => void;
}

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
        // If no search term, just fetch the first page
        await fetchPractitioners('', 0);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Try identifier search first
        const identifierPath = `Practitioner?_count=${pageSize}&_getpagesoffset=0&_sort=name&identifier=${encodeURIComponent(term)}`;
        const identifierUrl = getFhirUrl(identifierPath);
        console.log('Fetching by identifier:', identifierUrl);
        
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
        console.log('Fetching by family name:', familyUrl);
        
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
        // Try searching by identifier, family name, or given name
        // Note: This will be an AND condition, but let's test if the parameters work
        path += `&identifier=${encodeURIComponent(term)}&family=${encodeURIComponent(term)}&given=${encodeURIComponent(term)}`;
      }

      const url = getFhirUrl(path);
      console.log('Fetching practitioners with URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch practitioners: ${response.status} ${response.statusText}`);
      }

      const data: unknown = await response.json();
      console.log('FHIR Response:', data);

      // Handle bundle response
      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<Practitioner | OperationOutcome>;
        
        // Store the full URLs from the bundle links
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);

        // Extract practitioners from bundle
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
        console.log('Fetching next page with URL:', nextPageUrl);
        const response = await fetch(nextPageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch next page: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if ('resourceType' in data && data.resourceType === 'Bundle') {
          const bundle = data as Bundle<Practitioner | OperationOutcome>;
          
          // Store the full URLs from the bundle links
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);

          // Extract practitioners from bundle
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
        console.log('Fetching previous page with URL:', prevPageUrl);
        const response = await fetch(prevPageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch previous page: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if ('resourceType' in data && data.resourceType === 'Bundle') {
          const bundle = data as Bundle<Practitioner | OperationOutcome>;
          
          // Store the full URLs from the bundle links
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);

          // Extract practitioners from bundle
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
          placeholder="Search by identifier or surname..."
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
      
      {practitioners.length === 0 && !loading ? (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          {searchTerm ? 'No practitioners found matching your search' : 'No practitioners found'}
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            padding: '1rem'
          }}>
            {practitioners.map((practitioner) => (
              <div
                key={practitioner.id}
                onClick={() => onSelectPractitioner(practitioner)}
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
                  {practitioner.name?.[0]?.family || 'No Family Name'}, {practitioner.name?.[0]?.given?.join(' ') || 'No Given Name'}
                </h3>
                <div style={{ color: '#666' }}>
                  <div>ID: {practitioner.id}</div>
                  {practitioner.identifier?.map((id: Identifier, index: number) => (
                    <div key={index}>
                      {id.system}: {id.value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Always show pagination if we have results */}
          {practitioners.length > 0 && (
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