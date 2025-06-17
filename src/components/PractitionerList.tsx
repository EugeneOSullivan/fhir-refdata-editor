import { useState, useEffect, useCallback } from 'react';
import type { Practitioner, Bundle } from '@medplum/fhirtypes';
import { fhirClient } from '../fhirClient';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { SelectionHandler } from '../types/fhir';
import '../styles/components.css';

interface PractitionerListProps {
  onSelectPractitioner: SelectionHandler<Practitioner>;
}

export function PractitionerList({ onSelectPractitioner }: PractitionerListProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const searchPractitioners = useCallback(async (search: string = '', url?: string) => {
    setLoading(true);
    setError(null);

    try {
      let searchUrl: string;
      
      if (url) {
        searchUrl = url;
      } else {
        const params = new URLSearchParams();
        if (search) {
          params.append('_text', search);
        }
        params.append('_count', '20');
        searchUrl = `Practitioner?${params.toString()}`;
      }

      const bundle = await fhirClient.get<Bundle<Practitioner>>(searchUrl);
      
      setPractitioners(bundle.entry?.map(entry => entry.resource as Practitioner) || []);
      setNextPageUrl(bundle.link?.find(link => link.relation === 'next')?.url || null);
      setPrevPageUrl(bundle.link?.find(link => link.relation === 'previous')?.url || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load practitioners');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    searchPractitioners(term);
  }, [searchPractitioners]);

  const handlePrevPage = useCallback(() => {
    if (prevPageUrl) {
      searchPractitioners(searchTerm, prevPageUrl);
    }
  }, [prevPageUrl, searchTerm, searchPractitioners]);

  const handleNextPage = useCallback(() => {
    if (nextPageUrl) {
      searchPractitioners(searchTerm, nextPageUrl);
    }
  }, [nextPageUrl, searchTerm, searchPractitioners]);

  useEffect(() => {
    searchPractitioners();
  }, [searchPractitioners]);

  const formatName = (practitioner: Practitioner): string => {
    if (!practitioner.name || practitioner.name.length === 0) {
      return 'Unnamed';
    }
    
    const name = practitioner.name[0];
    const parts = [];
    
    if (name.prefix && name.prefix.length > 0) {
      parts.push(name.prefix.join(' '));
    }
    if (name.given && name.given.length > 0) {
      parts.push(name.given.join(' '));
    }
    if (name.family) {
      parts.push(name.family);
    }
    if (name.suffix && name.suffix.length > 0) {
      parts.push(name.suffix.join(' '));
    }
    
    return parts.join(' ') || 'Unnamed';
  };

  const formatIdentifiers = (identifiers: Practitioner['identifier']): string => {
    if (!identifiers || identifiers.length === 0) {
      return 'No identifiers';
    }
    
    return identifiers
      .map(id => `${id.system || 'Unknown system'}: ${id.value}`)
      .join(', ');
  };

  if (loading && practitioners.length === 0) {
    return <LoadingSkeleton type="table" rows={5} />;
  }

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Practitioners</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by identifier or name..."
            className="fhir-search-input"
          />
        </div>

        {error && <div className="fhir-error">{error}</div>}

        {loading ? (
          <LoadingSkeleton type="table" rows={3} />
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