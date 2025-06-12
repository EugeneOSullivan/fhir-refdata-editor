import { useState, useEffect, useMemo, useRef } from 'react';
import type { Practitioner, Bundle, OperationOutcome } from '@medplum/fhirtypes';
import { getFhirUrl } from '../fhirClient';
import { debounce } from 'lodash';

interface PractitionerPickerProps {
  value?: string; // The current reference string like "Practitioner/123"
  onChange: (reference: string | undefined, practitioner: Practitioner | undefined) => void;
  placeholder?: string;
}

export function PractitionerPicker({ value, onChange, placeholder = "Search for a practitioner..." }: PractitionerPickerProps) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | undefined>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load practitioner details when value changes
  useEffect(() => {
    if (value && value.startsWith('Practitioner/')) {
      const practitionerId = value.replace('Practitioner/', '');
      fetchPractitionerById(practitionerId);
    } else {
      setSelectedPractitioner(undefined);
    }
  }, [value]);

  const fetchPractitionerById = async (id: string) => {
    try {
      const url = getFhirUrl(`Practitioner/${id}`);
      const response = await fetch(url);
      if (response.ok) {
        const practitioner = await response.json();
        setSelectedPractitioner(practitioner);
      }
    } catch (err) {
      console.error('Error fetching practitioner:', err);
    }
  };

  // Debounce search term changes
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term || term.length < 2) {
        setPractitioners([]);
        return;
      }
      setLoading(true);
      try {
        // Search by family name and given name
        const familyPath = `Practitioner?_count=20&family=${encodeURIComponent(term)}`;
        const givenPath = `Practitioner?_count=20&given=${encodeURIComponent(term)}`;
        
        const [familyResponse, givenResponse] = await Promise.all([
          fetch(getFhirUrl(familyPath)),
          fetch(getFhirUrl(givenPath))
        ]);

        const allPractitioners: Practitioner[] = [];
        const seenIds = new Set<string>();

        if (familyResponse.ok) {
          const familyData = await familyResponse.json();
          if (familyData.resourceType === 'Bundle') {
            const bundle = familyData as Bundle<Practitioner | OperationOutcome>;
            bundle.entry?.forEach(entry => {
              if (entry.resource?.resourceType === 'Practitioner' && entry.resource.id && !seenIds.has(entry.resource.id)) {
                allPractitioners.push(entry.resource);
                seenIds.add(entry.resource.id);
              }
            });
          }
        }

        if (givenResponse.ok) {
          const givenData = await givenResponse.json();
          if (givenData.resourceType === 'Bundle') {
            const bundle = givenData as Bundle<Practitioner | OperationOutcome>;
            bundle.entry?.forEach(entry => {
              if (entry.resource?.resourceType === 'Practitioner' && entry.resource.id && !seenIds.has(entry.resource.id)) {
                allPractitioners.push(entry.resource);
                seenIds.add(entry.resource.id);
              }
            });
          }
        }

        setPractitioners(allPractitioners);
      } catch (err) {
        console.error('Error searching practitioners:', err);
        setPractitioners([]);
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

  const handleSelect = (practitioner: Practitioner) => {
    setSelectedPractitioner(practitioner);
    setSearchTerm('');
    setIsOpen(false);
    onChange(`Practitioner/${practitioner.id}`, practitioner);
  };

  const handleClear = () => {
    setSelectedPractitioner(undefined);
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

  const formatPractitionerName = (practitioner: Practitioner) => {
    const name = practitioner.name?.[0];
    if (!name) return `Practitioner ${practitioner.id}`;
    const family = name.family || '';
    const given = name.given?.join(' ') || '';
    return `${family}, ${given}`.trim().replace(/^,\s*|,\s*$/, '') || `Practitioner ${practitioner.id}`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {selectedPractitioner ? (
          <div className="fhir-picker-selected">
            <span style={{ flex: 1 }}>
              {formatPractitionerName(selectedPractitioner)}
            </span>
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
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {loading && (
            <div style={{ padding: '0.5rem', color: '#666', textAlign: 'center' }}>
              Searching...
            </div>
          )}
          {!loading && practitioners.length === 0 && searchTerm.length >= 2 && (
            <div style={{ padding: '0.5rem', color: '#666', textAlign: 'center' }}>
              No practitioners found
            </div>
          )}
          {!loading && practitioners.map((practitioner) => (
            <div
              key={practitioner.id}
              onClick={() => handleSelect(practitioner)}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                borderBottom: '1px solid #eee'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {formatPractitionerName(practitioner)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                ID: {practitioner.id}
                {practitioner.identifier && practitioner.identifier.length > 0 && (
                  <span> • {practitioner.identifier[0].system}: {practitioner.identifier[0].value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 