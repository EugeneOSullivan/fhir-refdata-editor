import { useState, useEffect, useCallback } from 'react';
import type { PractitionerRole, Bundle, Practitioner } from '@medplum/fhirtypes';
import { fhirClient } from '../fhirClient';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { SelectionHandler } from '../types/fhir';
import '../styles/components.css';

interface PractitionerRoleListProps {
  onSelectPractitionerRole: SelectionHandler<PractitionerRole>;
}

export function PractitionerRoleList({ onSelectPractitionerRole }: PractitionerRoleListProps) {
  const [practitionerRoles, setPractitionerRoles] = useState<PractitionerRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const searchPractitionerRoles = useCallback(async (search: string = '', url?: string) => {
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
        searchUrl = `PractitionerRole?${params.toString()}`;
      }

      const bundle = await fhirClient.get<Bundle<PractitionerRole>>(searchUrl);
      
      setPractitionerRoles(bundle.entry?.map(entry => entry.resource as PractitionerRole) || []);
      setNextPageUrl(bundle.link?.find(link => link.relation === 'next')?.url || null);
      setPrevPageUrl(bundle.link?.find(link => link.relation === 'previous')?.url || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load practitioner roles');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    searchPractitionerRoles(term);
  }, [searchPractitionerRoles]);

  const handlePrevPage = useCallback(() => {
    if (prevPageUrl) {
      searchPractitionerRoles(searchTerm, prevPageUrl);
    }
  }, [prevPageUrl, searchTerm, searchPractitionerRoles]);

  const handleNextPage = useCallback(() => {
    if (nextPageUrl) {
      searchPractitionerRoles(searchTerm, nextPageUrl);
    }
  }, [nextPageUrl, searchTerm, searchPractitionerRoles]);

  useEffect(() => {
    searchPractitionerRoles();
  }, [searchPractitionerRoles]);

  const formatPractitionerName = (reference: string | undefined): string => {
    if (!reference) return 'Unknown';
    // Extract ID from reference like "Practitioner/123"
    const parts = reference.split('/');
    return parts.length > 1 ? parts[1] : reference;
  };

  const formatOrganizationName = (reference: string | undefined): string => {
    if (!reference) return 'Unknown';
    // Extract ID from reference like "Organization/123"
    const parts = reference.split('/');
    return parts.length > 1 ? parts[1] : reference;
  };

  const formatCodes = (codes: PractitionerRole['code'] | PractitionerRole['specialty']): string => {
    if (!codes || codes.length === 0) {
      return 'Not specified';
    }
    
    const code = codes[0];
    if (code.coding && code.coding.length > 0) {
      return code.coding[0].display || code.coding[0].code || 'Unknown';
    }
    return code.text || 'Not specified';
  };

  if (loading && practitionerRoles.length === 0) {
    return <LoadingSkeleton type="table" rows={5} />;
  }

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Practitioner Roles</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by practitioner or organization..."
            className="fhir-search-input"
          />
        </div>

        {error && <div className="fhir-error">{error}</div>}

        {loading ? (
          <LoadingSkeleton type="table" rows={3} />
        ) : practitionerRoles.length === 0 ? (
          <div className="fhir-empty">
            No practitioner roles found
          </div>
        ) : (
          <>
            <table className="fhir-table">
              <thead>
                <tr>
                  <th className="fhir-table-header">Practitioner</th>
                  <th className="fhir-table-header">Organization</th>
                  <th className="fhir-table-header">Role</th>
                  <th className="fhir-table-header">Specialty</th>
                  <th className="fhir-table-header">Status</th>
                  <th className="fhir-table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {practitionerRoles.map((role) => (
                  <tr key={role.id} className="fhir-table-row">
                    <td className="fhir-table-cell">{formatPractitionerName(role.practitioner?.reference)}</td>
                    <td className="fhir-table-cell">{formatOrganizationName(role.organization?.reference)}</td>
                    <td className="fhir-table-cell">{formatCodes(role.code)}</td>
                    <td className="fhir-table-cell">{formatCodes(role.specialty)}</td>
                    <td className="fhir-table-cell">
                      <span className={`fhir-badge ${role.active !== false ? 'fhir-badge-active' : 'fhir-badge-inactive'}`}>
                        {role.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="fhir-table-cell">
                      <button 
                        className="fhir-btn fhir-btn-success"
                        onClick={() => onSelectPractitionerRole(role)}
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