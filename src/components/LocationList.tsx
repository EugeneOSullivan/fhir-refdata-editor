import { useState, useEffect, useCallback } from 'react';
import type { Location, Bundle } from '@medplum/fhirtypes';
import { fhirClient } from '../fhirClient';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { SelectionHandler } from '../types/fhir';
import '../styles/components.css';

interface LocationListProps {
  onSelectLocation: SelectionHandler<Location>;
}

export function LocationList({ onSelectLocation }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const searchLocations = useCallback(async (search: string = '', url?: string) => {
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
        searchUrl = `Location?${params.toString()}`;
      }

      const bundle = await fhirClient.get<Bundle<Location>>(searchUrl);
      
      setLocations(bundle.entry?.map(entry => entry.resource as Location) || []);
      setNextPageUrl(bundle.link?.find(link => link.relation === 'next')?.url || null);
      setPrevPageUrl(bundle.link?.find(link => link.relation === 'previous')?.url || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    searchLocations(term);
  }, [searchLocations]);

  const handlePrevPage = useCallback(() => {
    if (prevPageUrl) {
      searchLocations(searchTerm, prevPageUrl);
    }
  }, [prevPageUrl, searchTerm, searchLocations]);

  const handleNextPage = useCallback(() => {
    if (nextPageUrl) {
      searchLocations(searchTerm, nextPageUrl);
    }
  }, [nextPageUrl, searchTerm, searchLocations]);

  useEffect(() => {
    searchLocations();
  }, [searchLocations]);

  const formatType = (types: Location['type']): string => {
    if (!types || types.length === 0) {
      return 'Not specified';
    }
    
    const type = types[0];
    if (type.coding && type.coding.length > 0) {
      return type.coding[0].display || type.coding[0].code || 'Unknown';
    }
    return type.text || 'Not specified';
  };

  const formatAddress = (address: Location['address']): string => {
    if (!address) {
      return 'No address';
    }
    
    const parts = [];
    
    if (address.line && address.line.length > 0) {
      parts.push(address.line.join(', '));
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.state) {
      parts.push(address.state);
    }
    
    return parts.join(', ') || 'No address';
  };

  if (loading && locations.length === 0) {
    return <LoadingSkeleton type="table" rows={5} />;
  }

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">Locations</h2>

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