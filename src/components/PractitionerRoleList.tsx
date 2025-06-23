import { useState, useEffect, useRef } from 'react';
import type { PractitionerRole, Bundle, OperationOutcome, Practitioner, Organization } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { PractitionerPicker } from './PractitionerPicker';
import '../styles/components.css';

interface PractitionerRoleListProps {
  onSelectPractitionerRole: (practitionerRole: PractitionerRole) => void;
  onCreateNewWithPractitioner?: (practitioner: Practitioner) => void;
}

export function PractitionerRoleList({ onSelectPractitionerRole, onCreateNewWithPractitioner }: PractitionerRoleListProps) {
  const [practitionerRoles, setPractitionerRoles] = useState<PractitionerRole[]>([]);
  const [roleDetails, setRoleDetails] = useState<Map<string, { practitioner?: Practitioner; organization?: Organization }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | undefined>();
  const [practitionerReference, setPractitionerReference] = useState<string>('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const pageSize = 10;
  const fetchedDetailsRef = useRef<Set<string>>(new Set());

  // Effect to search by practitioner reference
  useEffect(() => {
    if (practitionerReference) {
      fetchedDetailsRef.current.clear(); // Clear cached details when filtering changes
      setRoleDetails(new Map()); // Clear role details
      fetchPractitionerRolesByPractitioner(practitionerReference, 0);
    } else {
      fetchedDetailsRef.current.clear(); // Clear cached details when filtering changes
      setRoleDetails(new Map()); // Clear role details
      fetchPractitionerRoles('', 0);
    }
  }, [practitionerReference]);

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
  };

  const handleCreateNewForPractitioner = () => {
    if (selectedPractitioner && onCreateNewWithPractitioner) {
      onCreateNewWithPractitioner(selectedPractitioner);
    }
  };

  // Fetch practitioner details
  const fetchPractitionerDetails = async (practitionerRef: string): Promise<Practitioner | undefined> => {
    try {
      const url = getFhirUrl(practitionerRef);
      const response = await fetch(url);
      if (response.ok) {
        const practitioner = await response.json();
        return practitioner;
      } else {
        console.warn('Failed to fetch practitioner:', response.status, response.statusText);
      }
    } catch (err) {
      console.warn('Failed to fetch practitioner details:', err);
    }
    return undefined;
  };

  // Fetch organization details
  const fetchOrganizationDetails = async (organizationRef: string): Promise<Organization | undefined> => {
    try {
      const url = getFhirUrl(organizationRef);
      const response = await fetch(url);
      if (response.ok) {
        const organization = await response.json();
        return organization;
      } else {
        console.warn('Failed to fetch organization:', response.status, response.statusText);
      }
    } catch (err) {
      console.warn('Failed to fetch organization details:', err);
    }
    return undefined;
  };

  // Fetch details for all practitioner roles
  const fetchDetailsForRoles = async (roles: PractitionerRole[]) => {
    setLoadingDetails(true);
    try {
      const detailsMap = new Map<string, { practitioner?: Practitioner; organization?: Organization }>();
      
      await Promise.all(
        roles.map(async (role) => {
          const roleKey = role.id || '';
          
          if (fetchedDetailsRef.current.has(roleKey)) {
            return; // Already fetched details for this role
          }

          const practitionerDetails = role.practitioner?.reference 
            ? await fetchPractitionerDetails(role.practitioner.reference)
            : undefined;
          
          const organizationDetails = role.organization?.reference
            ? await fetchOrganizationDetails(role.organization.reference)
            : undefined;

          fetchedDetailsRef.current.add(roleKey);
          
          detailsMap.set(roleKey, {
            practitioner: practitionerDetails,
            organization: organizationDetails
          });
        })
      );
      
      setRoleDetails(prevDetails => {
        const newDetails = new Map(prevDetails);
        detailsMap.forEach((details, key) => {
          newDetails.set(key, details);
        });
        return newDetails;
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Effect to fetch details when practitioner roles change
  useEffect(() => {
    const rolesToFetch = practitionerRoles.filter(role => {
      const roleKey = role.id || '';
      return !fetchedDetailsRef.current.has(roleKey) && (
        role.practitioner?.reference || role.organization?.reference
      );
    });
    
    if (rolesToFetch.length > 0) {
      fetchDetailsForRoles(rolesToFetch);
    }
  }, [practitionerRoles.length]); // Only depend on length, not the entire array

  const formatCodes = (codes: any[] | undefined) => {
    if (!codes || codes.length === 0) return 'Not specified';
    return codes.map(code => 
      code.coding?.[0]?.display || code.text || 'Unknown'
    ).join(', ');
  };

  const formatPractitionerName = (role: PractitionerRole) => {
    if (!role.practitioner?.reference) return 'Not specified';
    
    const roleKey = role.id || '';
    const details = roleDetails.get(roleKey);
    const practitionerDetails = details?.practitioner;
    
    if (practitionerDetails) {
      const name = practitionerDetails.name?.[0];
      if (name) {
        const displayName = [name.prefix, name.given, name.family]
          .flat()
          .filter(Boolean)
          .join(' ');
        return `${displayName} (${role.practitioner.reference})`;
      }
    }
    
    // Fallback to reference if details not loaded
    return role.practitioner.reference;
  };

  const formatOrganizationName = (role: PractitionerRole) => {
    if (!role.organization?.reference) return 'Not specified';
    
    const roleKey = role.id || '';
    const details = roleDetails.get(roleKey);
    const organizationDetails = details?.organization;
    
    if (organizationDetails) {
      const name = organizationDetails.name;
      if (name) {
        return `${name} (${role.organization.reference})`;
      }
    }
    
    // Fallback to reference if details not loaded
    return role.organization.reference;
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Practitioner Roles</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
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
            {loadingDetails && (
              <div className="fhir-loading" style={{ marginBottom: '1rem' }}>
                Loading details...
              </div>
            )}
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
                {practitionerRoles.map((role) => {
                  const roleKey = role.id || '';
                  const details = roleDetails.get(roleKey);
                  const practitionerDetails = details?.practitioner;
                  const organizationDetails = details?.organization;
                  
                  return (
                    <tr key={role.id} className="fhir-table-row">
                      <td className="fhir-table-cell">
                        {practitionerDetails ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {formatPractitionerName(role)}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#666', fontStyle: 'italic' }}>
                            {role.practitioner?.reference || 'Not specified'}
                          </div>
                        )}
                      </td>
                      <td className="fhir-table-cell">
                        {organizationDetails ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {formatOrganizationName(role)}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#666', fontStyle: 'italic' }}>
                            {role.organization?.reference || 'Not specified'}
                          </div>
                        )}
                      </td>
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
                  );
                })}
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