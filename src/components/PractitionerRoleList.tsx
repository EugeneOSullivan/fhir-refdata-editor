import { useState, useEffect, useMemo } from 'react';
import type { PractitionerRole, Bundle, OperationOutcome, Practitioner } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import { PractitionerPicker } from './PractitionerPicker';
import '../styles/components.css';

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
      const path = `PractitionerRole?practitioner=${encodeURIComponent(practitionerRef)}&_count=${pageSize}&_getpagesoffset=${offset}`;
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
    setSearchTerm('');
  };

  const handleCreateNewForPractitioner = () => {
    if (selectedPractitioner && onCreateNewWithPractitioner) {
      onCreateNewWithPractitioner(selectedPractitioner);
    }
  };

  const formatCodes = (codes: any[] | undefined) => {
    if (!codes || codes.length === 0) return 'Not specified';
    return codes.map(code => 
      code.coding?.[0]?.display || code.text || 'Unknown'
    ).join(', ');
  };

  const formatPractitionerName = (practitionerRef: string | undefined) => {
    if (!practitionerRef) return 'Not specified';
    return practitionerRef.replace('Practitioner/', '');
  };

  const formatOrganizationName = (organizationRef: string | undefined) => {
    if (!organizationRef) return 'Not specified';
    return organizationRef.replace('Organization/', '');
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Practitioner Roles</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1' }}>
              <label className="fhir-label-small">Filter by Practitioner</label>
              <PractitionerPicker 
                value={practitionerReference} 
                onChange={handlePractitionerChange}
                placeholder="Search for a practitioner to filter roles..."
              />
            </div>
            {selectedPractitioner && onCreateNewWithPractitioner && (
              <div style={{ alignSelf: 'flex-end' }}>
                <button 
                  className="fhir-btn fhir-btn-success"
                  onClick={handleCreateNewForPractitioner}
                >
                  Create New Role
                </button>
              </div>
            )}
          </div>

          {!practitionerReference && (
            <div className="fhir-field-spacing">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by identifier..."
                className="fhir-search-input"
              />
            </div>
          )}
        </div>

        {error && <div className="fhir-error">{error}</div>}

        {loading ? (
          <div className="fhir-loading">Loading practitioner roles...</div>
        ) : practitionerRoles.length === 0 ? (
          <div className="fhir-empty">
            {practitionerReference 
              ? "No roles found for this practitioner" 
              : "No practitioner roles found"}
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
                        className="fhir-btn fhir-btn-primary"
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