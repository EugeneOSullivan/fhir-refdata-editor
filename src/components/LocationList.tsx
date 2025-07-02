import type { Location } from '@medplum/fhirtypes';
import { useFhirSearch } from '../hooks/useFhirSearch';
import '../styles/components.css';

interface LocationListProps {
  onSelectLocation: (location: Location) => void;
}

export function LocationList({ onSelectLocation }: LocationListProps) {
  const {
    data: locations,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleNextPage,
    handlePrevPage,
    nextPageUrl,
    prevPageUrl,
    refresh,
  } = useFhirSearch<Location>('Location');

  

  const formatAddress = (address: Location['address']) => {
    if (!address) return 'No address provided';
    
    const parts = [];
    if (address.line && address.line.length > 0) {
      parts.push(address.line.join(', '));
    }
    
    const cityParts = [];
    if (address.city) cityParts.push(address.city);
    if (address.state) cityParts.push(address.state);
    if (address.postalCode) cityParts.push(address.postalCode);
    
    if (cityParts.length > 0) {
      parts.push(cityParts.join(', '));
    }
    
    if (address.country) {
      parts.push(address.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No address details';
  };

  const formatType = (types: Location['type']) => {
    if (!types || types.length === 0) return 'Not specified';
    const type = types[0];
    if (type.coding && type.coding.length > 0) {
      return type.coding[0].display || type.coding[0].code || 'Unknown';
    }
    return 'Not specified';
  };


  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Locations</h2>

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
          <div className="fhir-loading">Loading locations...</div>
        ) : locations.length === 0 ? (
          <div className="fhir-empty">No locations found</div>
        ) : (
          <>
            <table className="fhir-table">
              <thead>
                <tr>
                  <th className="fhir-table-header">Name</th>
                  <th className="fhir-table-header">Type</th>
                  <th className="fhir-table-header">Address</th>
                  <th className="fhir-table-header">Status</th>
                  <th className="fhir-table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location.id} className="fhir-table-row">
                    <td className="fhir-table-cell">{location.name || 'Unnamed'}</td>
                    <td className="fhir-table-cell">{formatType(location.type)}</td>
                    <td className="fhir-table-cell">{formatAddress(location.address)}</td>
                    <td className="fhir-table-cell">
                      <span className={`fhir-badge ${location.status === 'active' ? 'fhir-badge-active' : location.status === 'suspended' ? 'fhir-badge-suspended' : 'fhir-badge-inactive'}`}>
                        {location.status || 'inactive'}
                      </span>
                    </td>
                    <td className="fhir-table-cell">
                      <button 
                        className="fhir-btn fhir-btn-success"
                        onClick={() => onSelectLocation(location)}
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