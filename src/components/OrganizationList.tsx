import { useState, useEffect, useCallback } from 'react';
import type { Organization, Bundle } from '@medplum/fhirtypes';
import { fhirClient } from '../fhirClient';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { SelectionHandler } from '../types/fhir';
import '../styles/components.css';

interface OrganizationListProps {
  onSelectOrganization: SelectionHandler<Organization>;
}

export function OrganizationList({ onSelectOrganization }: OrganizationListProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const searchOrganizations = useCallback(async (search: string = '', url?: string) => {
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
        searchUrl = `Organization?${params.toString()}`;
      }

      const bundle = await fhirClient.get<Bundle<Organization>>(searchUrl);
      
      setOrganizations(bundle.entry?.map(entry => entry.resource as Organization) || []);
      setNextPageUrl(bundle.link?.find(link => link.relation === 'next')?.url || null);
      setPrevPageUrl(bundle.link?.find(link => link.relation === 'previous')?.url || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    searchOrganizations(term);
  }, [searchOrganizations]);

  const handlePrevPage = useCallback(() => {
    if (prevPageUrl) {
      searchOrganizations(searchTerm, prevPageUrl);
    }
  }, [prevPageUrl, searchTerm, searchOrganizations]);

  const handleNextPage = useCallback(() => {
    if (nextPageUrl) {
      searchOrganizations(searchTerm, nextPageUrl);
    }
  }, [nextPageUrl, searchTerm, searchOrganizations]);

  useEffect(() => {
    searchOrganizations();
  }, [searchOrganizations]);

  const formatIdentifiers = (identifiers: Organization['identifier']): string => {
    if (!identifiers || identifiers.length === 0) {
      return 'No identifiers';
    }
    
    return identifiers
      .map(id => `${id.system || 'Unknown system'}: ${id.value}`)
      .join(', ');
  };

  const formatType = (types: Organization['type']): string => {
    if (!types || types.length === 0) {
      return 'Not specified';
    }
    
    const type = types[0];
    if (type.coding && type.coding.length > 0) {
      return type.coding[0].display || type.coding[0].code || 'Unknown';
    }
    return type.text || 'Not specified';
  };

  if (loading && organizations.length === 0) {
    return <LoadingSkeleton type="table" rows={5} />;
  }

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Organizations</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or identifier..."
            className="fhir-search-input"
          />
        </div>

        {error && <div className="fhir-error">{error}</div>}

        {loading ? (
          <LoadingSkeleton type="table" rows={3} />
        ) : organizations.length === 0 ? (
          <div className="fhir-empty">No organizations found</div>
        ) : (
          <>
            <table className="fhir-table">
              <thead>
                <tr>
                  <th className="fhir-table-header">Name</th>
                  <th className="fhir-table-header">Type</th>
                  <th className="fhir-table-header">Identifiers</th>
                  <th className="fhir-table-header">Status</th>
                  <th className="fhir-table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id} className="fhir-table-row">
                    <td className="fhir-table-cell">{organization.name || 'Unnamed'}</td>
                    <td className="fhir-table-cell">{formatType(organization.type)}</td>
                    <td className="fhir-table-cell">{formatIdentifiers(organization.identifier)}</td>
                    <td className="fhir-table-cell">
                      <span className={`fhir-badge ${organization.active ? 'fhir-badge-active' : 'fhir-badge-inactive'}`}>
                        {organization.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="fhir-table-cell">
                      <button 
                        className="fhir-btn fhir-btn-success"
                        onClick={() => onSelectOrganization(organization)}
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