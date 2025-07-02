import type { Organization, Identifier } from '@medplum/fhirtypes';
import { useFhirSearch } from '../hooks/useFhirSearch';
import '../styles/components.css';

interface OrganizationListProps {
  onSelectOrganization: (organization: Organization) => void;
}

export function OrganizationList({ onSelectOrganization }: OrganizationListProps) {
  const {
    data: organizations,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleNextPage,
    handlePrevPage,
    nextPageUrl,
    prevPageUrl,
    refresh,
  } = useFhirSearch<Organization>('Organization');

  

  const formatIdentifiers = (identifiers: Identifier[] | undefined) => {
    if (!identifiers || identifiers.length === 0) return 'None';
    return identifiers.map(id => {
      const system = id.system ? `${id.system}: ` : '';
      return `${system}${id.value || 'Unknown'}`;
    }).join(', ');
  };

  const formatType = (types: Organization['type']) => {
    if (!types || types.length === 0) return 'Not specified';
    const type = types[0];
    if (type.coding && type.coding.length > 0) {
      return type.coding[0].display || type.coding[0].code || 'Unknown';
    }
    return 'Not specified';
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Organizations</h2>

      <div className="fhir-form-wrapper-content">
        <div className="fhir-search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by identifier..."
            className="fhir-search-input"
          />
        </div>

        {error && (
          <div className="fhir-error">
            <div>{error}</div>
            <button
              className="fhir-btn fhir-btn-primary"
              onClick={refresh}
              style={{ marginTop: '0.5rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="fhir-loading">Loading organizations...</div>
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