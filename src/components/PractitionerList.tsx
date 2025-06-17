import { useState, useEffect, useMemo } from 'react';
import type { Practitioner, Identifier, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import '../styles/components.css';

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
    const name = practitioner.name?.[0];
    if (!name) return 'Unknown';
    
    const given = name.given?.join(' ') || '';
    const family = name.family || '';
    
    return `${given} ${family}`.trim() || 'Unknown';
  };

  const formatIdentifiers = (identifiers: Identifier[] | undefined) => {
    if (!identifiers || identifiers.length === 0) return 'None';
    
    return identifiers.map(id => {
      const system = id.system ? `${id.system}: ` : '';
      return `${system}${id.value || 'Unknown'}`;
    }).join(', ');
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Practitioners</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by identifier or name..."
            className="fhir-search-input"
          />
        </div>

        {error && <div className="fhir-error">{error}</div>}

        {loading ? (
          <div className="fhir-loading">Loading practitioners...</div>
        ) : practitioners.length === 0 ? (
          <div className="fhir-empty">No practitioners found</div>
        ) : (
          <>
            <table className="fhir-table">
              <thead>
                <tr>
                  <th className="fhir-table-header">Name</th>
                  <th className="fhir-table-header">Identifiers</th>
                  <th className="fhir-table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {practitioners.map((practitioner) => (
                  <tr key={practitioner.id} className="fhir-table-row">
                    <td className="fhir-table-cell">{formatName(practitioner)}</td>
                    <td className="fhir-table-cell">{formatIdentifiers(practitioner.identifier)}</td>
                    <td className="fhir-table-cell">
                      <button 
                        className="fhir-btn fhir-btn-success"
                        onClick={() => onSelectPractitioner(practitioner)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="fhir-section-spacing" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="fhir-btn fhir-btn-secondary"
                onClick={handlePrevPage}
                disabled={!prevPageUrl}
              >
                Previous
              </button>
              <button 
                className="fhir-btn fhir-btn-secondary"
                onClick={handleNextPage}
                disabled={!nextPageUrl}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 