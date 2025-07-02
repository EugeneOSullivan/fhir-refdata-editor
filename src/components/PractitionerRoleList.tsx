import type { PractitionerRole } from '@medplum/fhirtypes';
import { useFhirSearch } from '../hooks/useFhirSearch';
import '../styles/components.css';

interface PractitionerRoleListProps {
  onSelectPractitionerRole: (practitionerRole: PractitionerRole) => void;
}

export function PractitionerRoleList({ onSelectPractitionerRole }: PractitionerRoleListProps) {
  const {
    data: practitionerRoles,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleNextPage,
    handlePrevPage,
    nextPageUrl,
    prevPageUrl,
    refresh,
  } = useFhirSearch<PractitionerRole>('PractitionerRole');

  

  const formatCodes = (codes: PractitionerRole['code']) => {
    if (!codes || codes.length === 0) return 'Not specified';
    return codes.map(code => 
      code.coding?.[0]?.display || code.text || 'Unknown'
    ).join(', ');
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Practitioner Roles</h2>

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
          <div className="fhir-loading">Loading practitioner roles...</div>
        ) : practitionerRoles.length === 0 ? (
          <div className="fhir-empty">No practitioner roles found</div>
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
                    <td className="fhir-table-cell">
                      {role.practitioner?.reference || 'Not specified'}
                    </td>
                    <td className="fhir-table-cell">
                      {role.organization?.reference || 'Not specified'}
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