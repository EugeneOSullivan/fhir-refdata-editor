import { useState, useEffect, useMemo } from 'react';
import type { Location, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import '../styles/components.css';

interface LocationListProps {
  onSelectLocation: (location: Location) => void;
}

export function LocationList({ onSelectLocation }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const pageSize = 10;

  // Debounce search term changes
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term) {
        await fetchLocations('', 0);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Try name search first
        const namePath = `Location?_count=${pageSize}&_getpagesoffset=0&_sort=name&name=${encodeURIComponent(term)}`;
        const nameUrl = getFhirUrl(namePath);
        const nameResponse = await fetch(nameUrl);
        if (!nameResponse.ok) {
          throw new Error(`Failed to fetch locations: ${nameResponse.status} ${nameResponse.statusText}`);
        }
        const nameData = await nameResponse.json();
        let allLocations: Location[] = [];
        let nextLink: string | null = null;
        let prevLink: string | null = null;
        if ('resourceType' in nameData && nameData.resourceType === 'Bundle') {
          const bundle = nameData as Bundle<Location | OperationOutcome>;
          const nameLocations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Location')
            .map(entry => entry.resource as Location) || [];
          allLocations = [...nameLocations];
          nextLink = bundle.link?.find(link => link.relation === 'next')?.url || null;
          prevLink = bundle.link?.find(link => link.relation === 'previous')?.url || null;
        }
        setLocations(allLocations);
        setNextPageUrl(nextLink);
        setPrevPageUrl(prevLink);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations');
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const fetchLocations = async (term: string, offset: number) => {
    setLoading(true);
    setError(null);
    try {
      let path = `Location?_count=${pageSize}&_getpagesoffset=${offset}&_sort=name`;
      if (term) {
        path += `&name=${encodeURIComponent(term)}`;
      }
      const url = getFhirUrl(path);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null && 'resourceType' in data && (data as { resourceType: string }).resourceType === 'Bundle') {
        const bundle = data as Bundle<Location | OperationOutcome>;
        const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
        const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
        setNextPageUrl(nextLink || null);
        setPrevPageUrl(prevLink || null);
        const locations = bundle.entry
          ?.filter(entry => entry.resource?.resourceType === 'Location')
          .map(entry => entry.resource as Location) || [];
        setLocations(locations);
        return;
      }
      throw new Error(`Unexpected response type: ${typeof data === 'object' && data !== null && 'resourceType' in data ? (data as { resourceType: string }).resourceType : 'unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
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
          const bundle = data as Bundle<Location | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const locations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Location')
            .map(entry => entry.resource as Location) || [];
          setLocations(locations);
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
          const bundle = data as Bundle<Location | OperationOutcome>;
          const nextLink = bundle.link?.find(link => link.relation === 'next')?.url;
          const prevLink = bundle.link?.find(link => link.relation === 'previous')?.url;
          setNextPageUrl(nextLink || null);
          setPrevPageUrl(prevLink || null);
          const locations = bundle.entry
            ?.filter(entry => entry.resource?.resourceType === 'Location')
            .map(entry => entry.resource as Location) || [];
          setLocations(locations);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch previous page');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatAddress = (address: any) => {
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

  const formatType = (types: any[] | undefined) => {
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
            placeholder="Search by name..."
            className="fhir-search-input"
          />
        </div>

        {error && <div className="fhir-error">{error}</div>}

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