import type { Practitioner, Identifier } from '@medplum/fhirtypes';
import { useFhirSearch } from '../hooks/useFhirSearch';
import '../styles/components.css';

interface PractitionerListProps {
  onSelectPractitioner: (practitioner: Practitioner) => void;
}

export function PractitionerList({ onSelectPractitioner }: PractitionerListProps) {
  const {
    data: practitioners,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleNextPage,
    handlePrevPage,
    nextPageUrl,
    prevPageUrl,
    refresh,
  } = useFhirSearch<Practitioner>('Practitioner');

  const formatName = (practitioner: Practitioner) => {
    const name = practitioner.name?.[0];
    if (!name) return 'Unknown';

    const given = name.given?.join(' ') || '';
    const family = name.family || '';

    return `${given} ${family}`.trim() || 'Unknown';
  };

  const formatIdentifiers = (identifiers: Identifier[] | undefined) => {
    if (!identifiers || identifiers.length === 0) return 'None';

    return identifiers
      .map((id) => {
        const system = id.system ? `${id.system}: ` : '';
        return `${system}${id.value || 'Unknown'}`;
      })
      .join(', ');
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