import { useState, useEffect, useMemo, useRef } from 'react';
import type { Organization, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';
import '../styles/components.css';

interface OrganizationPickerProps {
  value?: string; // The current reference string like "Organization/123"
  onChange: (reference: string | undefined, organization: Organization | undefined) => void;
  placeholder?: string;
}

export function OrganizationPicker({ value, onChange, placeholder = "Search for an organization..." }: OrganizationPickerProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load organization details when value changes
  useEffect(() => {
    if (value && value.startsWith('Organization/')) {
      const organizationId = value.replace('Organization/', '');
      fetchOrganizationById(organizationId);
    } else {
      setSelectedOrganization(undefined);
    }
  }, [value]);

  const fetchOrganizationById = async (id: string) => {
    try {
      const url = getFhirUrl(`Organization/${id}`);
      const response = await fetch(url);
      if (response.ok) {
        const organization = await response.json();
        setSelectedOrganization(organization);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
    }
  };

  // Debounce search term changes
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term || term.length < 2) {
        setOrganizations([]);
        return;
      }
      setLoading(true);
      try {
        // Search by name and identifier
        const namePath = `Organization?_count=20&name=${encodeURIComponent(term)}`;
        const identifierPath = `Organization?_count=20&identifier=${encodeURIComponent(term)}`;
        
        const [nameResponse, identifierResponse] = await Promise.all([
          fetch(getFhirUrl(namePath)),
          fetch(getFhirUrl(identifierPath))
        ]);

        const allOrganizations: Organization[] = [];
        const seenIds = new Set<string>();

        if (nameResponse.ok) {
          const nameData = await nameResponse.json();
          if (nameData.resourceType === 'Bundle') {
            const bundle = nameData as Bundle<Organization | OperationOutcome>;
            bundle.entry?.forEach(entry => {
              if (entry.resource?.resourceType === 'Organization' && entry.resource.id && !seenIds.has(entry.resource.id)) {
                allOrganizations.push(entry.resource);
                seenIds.add(entry.resource.id);
              }
            });
          }
        }

        if (identifierResponse.ok) {
          const identifierData = await identifierResponse.json();
          if (identifierData.resourceType === 'Bundle') {
            const bundle = identifierData as Bundle<Organization | OperationOutcome>;
            bundle.entry?.forEach(entry => {
              if (entry.resource?.resourceType === 'Organization' && entry.resource.id && !seenIds.has(entry.resource.id)) {
                allOrganizations.push(entry.resource);
                seenIds.add(entry.resource.id);
              }
            });
          }
        }

        setOrganizations(allOrganizations);
      } catch (err) {
        console.error('Error searching organizations:', err);
        setOrganizations([]);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (organization: Organization) => {
    setSelectedOrganization(organization);
    setSearchTerm('');
    setIsOpen(false);
    onChange(`Organization/${organization.id}`, organization);
  };

  const handleClear = () => {
    setSelectedOrganization(undefined);
    setSearchTerm('');
    onChange(undefined, undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(term.length >= 2);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  const formatOrganizationName = (organization: Organization) => {
    return organization.name || `Organization ${organization.id}`;
  };

  const getOrganizationIdentifier = (organization: Organization) => {
    if (organization.identifier && organization.identifier.length > 0) {
      const identifier = organization.identifier[0];
      return `${identifier.system || 'Unknown'}: ${identifier.value || 'N/A'}`;
    }
    return null;
  };

  return (
    <div ref={dropdownRef} className="fhir-picker-container">
      <div className="fhir-picker-wrapper">
        {selectedOrganization ? (
          <div className="fhir-picker-selected">
            <span>{formatOrganizationName(selectedOrganization)}</span>
            <button
              type="button"
              onClick={handleClear}
              className="fhir-picker-clear-btn"
            >
              ✕
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="fhir-picker-input"
          />
        )}
      </div>

      {isOpen && (
        <div className="fhir-picker-dropdown">
          {loading && (
            <div className="fhir-picker-message">
              Searching...
            </div>
          )}
          {!loading && organizations.length === 0 && searchTerm.length >= 2 && (
            <div className="fhir-picker-message">
              No organizations found
            </div>
          )}
          {!loading && organizations.map((organization) => (
            <div
              key={organization.id}
              onClick={() => handleSelect(organization)}
              className="fhir-picker-item"
            >
              <div className="fhir-picker-item-title">
                {formatOrganizationName(organization)}
              </div>
              <div className="fhir-picker-item-subtitle">
                ID: {organization.id}
                {getOrganizationIdentifier(organization) && (
                  <span> • {getOrganizationIdentifier(organization)}</span>
                )}
                {organization.type && organization.type.length > 0 && organization.type[0].coding && organization.type[0].coding.length > 0 && (
                  <span> • {organization.type[0].coding[0].display || organization.type[0].coding[0].code}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 