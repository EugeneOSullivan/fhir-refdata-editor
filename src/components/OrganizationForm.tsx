import { useState, useEffect } from 'react';
import type { Organization } from '@medplum/fhirtypes';
import { OrganizationPicker } from './OrganizationPicker';
import '../styles/components.css';

interface OrganizationFormProps {
  initialOrganization?: Organization;
  onSave: (organization: Organization) => Promise<Organization>;
  isCreating?: boolean;
}

export function OrganizationForm({ initialOrganization, onSave, isCreating = false }: OrganizationFormProps) {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [parentOrgRef, setParentOrgRef] = useState<string>('');
  
  // Identifiers
  const [identifiers, setIdentifiers] = useState<{system: string, value: string}[]>([{system: '', value: ''}]);
  
  // Telecom
  const [telecoms, setTelecoms] = useState<{system: string, value: string}[]>([{system: '', value: ''}]);
  
  // Address fields
  const [addressLines, setAddressLines] = useState<string[]>(['']);
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with existing data
  useEffect(() => {
    if (initialOrganization) {
      setName(initialOrganization.name || '');
      setType(initialOrganization.type?.[0]?.text || '');
      setActive(initialOrganization.active !== false);
      setParentOrgRef(initialOrganization.partOf?.reference || '');
      
      // Identifiers
      if (initialOrganization.identifier && initialOrganization.identifier.length > 0) {
        setIdentifiers(initialOrganization.identifier.map(id => ({
          system: id.system || '',
          value: id.value || ''
        })));
      }
      
      // Telecom
      if (initialOrganization.telecom && initialOrganization.telecom.length > 0) {
        setTelecoms(initialOrganization.telecom.map(t => ({
          system: t.system || '',
          value: t.value || ''
        })));
      }
      
      // Address
      const address = initialOrganization.address?.[0];
      if (address) {
        setAddressLines(address.line || ['']);
        setCity(address.city || '');
        setState(address.state || '');
        setPostalCode(address.postalCode || '');
        setCountry(address.country || '');
      }
    }
  }, [initialOrganization]);

  const handleAddIdentifier = () => {
    setIdentifiers([...identifiers, {system: '', value: ''}]);
  };

  const handleRemoveIdentifier = (index: number) => {
    setIdentifiers(identifiers.filter((_, i) => i !== index));
  };

  const handleIdentifierChange = (index: number, field: 'system' | 'value', value: string) => {
    const updated = [...identifiers];
    updated[index][field] = value;
    setIdentifiers(updated);
  };

  const handleAddTelecom = () => {
    setTelecoms([...telecoms, {system: '', value: ''}]);
  };

  const handleRemoveTelecom = (index: number) => {
    setTelecoms(telecoms.filter((_, i) => i !== index));
  };

  const handleTelecomChange = (index: number, field: 'system' | 'value', value: string) => {
    const updated = [...telecoms];
    updated[index][field] = value;
    setTelecoms(updated);
  };

  const handleAddAddressLine = () => {
    setAddressLines([...addressLines, '']);
  };

  const handleRemoveAddressLine = (index: number) => {
    setAddressLines(addressLines.filter((_, i) => i !== index));
  };

  const handleAddressLineChange = (index: number, value: string) => {
    const updated = [...addressLines];
    updated[index] = value;
    setAddressLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const organization: Organization = {
        resourceType: 'Organization',
        ...(initialOrganization?.id ? { id: initialOrganization.id } : {}),
        name: name.trim(),
        active
      };

      // Type
      if (type.trim()) {
        organization.type = [{ text: type.trim() }];
      }

      // Parent Organization
      if (parentOrgRef) {
        organization.partOf = {
          reference: parentOrgRef
        };
      }

      // Identifiers
      const validIdentifiers = identifiers.filter(id => id.value.trim());
      if (validIdentifiers.length > 0) {
        organization.identifier = validIdentifiers.map(id => ({
          system: id.system || undefined,
          value: id.value
        }));
      }

      // Telecom
      const validTelecoms = telecoms.filter(t => t.value.trim());
      if (validTelecoms.length > 0) {
        organization.telecom = validTelecoms.map(t => ({
          system: t.system as any || undefined,
          value: t.value
        }));
      }

      // Address
      const hasAddressData = addressLines.some(line => line.trim()) || city || state || postalCode || country;
      if (hasAddressData) {
        organization.address = [{
          line: addressLines.filter(line => line.trim()),
          city: city || undefined,
          state: state || undefined,
          postalCode: postalCode || undefined,
          country: country || undefined
        }];
      }

      await onSave(organization);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">
        {isCreating ? "Create New Organization" : "Edit Organization"}
      </h2>
      
      {error && (
        <div className="fhir-form-wrapper-error">
          Error: {error}
        </div>
      )}

      <div className="fhir-form-wrapper-content">
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Basic Information</legend>
            
            <div className="fhir-grid-2 fhir-field-spacing">
              <div>
                <label className="fhir-label-bold">
                  Name <span className="fhir-required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-bold">Type</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g., Hospital, Clinic"
                  className="fhir-input"
                />
              </div>
            </div>

            <div className="fhir-grid-2 fhir-field-spacing">
              <div>
                <label className="fhir-label-bold">Part Of (Parent Organization)</label>
                <OrganizationPicker 
                  value={parentOrgRef}
                  onChange={(ref) => setParentOrgRef(ref || '')}
                />
              </div>
              <div className="fhir-section-spacing">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="fhir-checkbox"
                  />
                  <span className="fhir-label-bold">Active</span>
                </label>
              </div>
            </div>
          </fieldset>

          {/* Identifiers */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Identifiers</legend>
            
            {identifiers.map((identifier, index) => (
              <div key={index} className="fhir-dynamic-section">
                <div className="fhir-dynamic-grid-3">
                  <div>
                    <label className="fhir-label-small">System</label>
                    <input
                      type="text"
                      value={identifier.system}
                      onChange={(e) => handleIdentifierChange(index, 'system', e.target.value)}
                      placeholder="e.g., http://example.com/identifiers"
                      className="fhir-input"
                    />
                  </div>
                  <div>
                    <label className="fhir-label-small">Value</label>
                    <input
                      type="text"
                      value={identifier.value}
                      onChange={(e) => handleIdentifierChange(index, 'value', e.target.value)}
                      placeholder="Identifier value"
                      className="fhir-input"
                    />
                  </div>
                  {identifiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIdentifier(index)}
                      className="fhir-btn-small fhir-btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddIdentifier}
              className="fhir-btn-small fhir-btn-success"
            >
              Add Identifier
            </button>
          </fieldset>

          {/* Contact Information */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Contact Information</legend>
            
            {telecoms.map((telecom, index) => (
              <div key={index} className="fhir-dynamic-section">
                <div className="fhir-dynamic-grid-3">
                  <div>
                    <label className="fhir-label-small">System</label>
                    <select
                      value={telecom.system}
                      onChange={(e) => handleTelecomChange(index, 'system', e.target.value)}
                      className="fhir-select"
                    >
                      <option value="">Select...</option>
                      <option value="phone">Phone</option>
                      <option value="fax">Fax</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                    </select>
                  </div>
                  <div>
                    <label className="fhir-label-small">Value</label>
                    <input
                      type="text"
                      value={telecom.value}
                      onChange={(e) => handleTelecomChange(index, 'value', e.target.value)}
                      placeholder="Contact value"
                      className="fhir-input"
                    />
                  </div>
                  {telecoms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTelecom(index)}
                      className="fhir-btn-small fhir-btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddTelecom}
              className="fhir-btn-small fhir-btn-success"
            >
              Add Contact
            </button>
          </fieldset>

          {/* Address */}
          <fieldset className="fhir-fieldset fhir-section-spacing">
            <legend className="fhir-legend">Address</legend>
            
            <div className="fhir-field-spacing">
              <label className="fhir-label-bold">Address Lines</label>
              {addressLines.map((line, index) => (
                <div key={index} className="fhir-dynamic-section">
                  <div className="fhir-dynamic-grid-2">
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => handleAddressLineChange(index, e.target.value)}
                      placeholder={`Address line ${index + 1}`}
                      className="fhir-input"
                    />
                    {addressLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddressLine(index)}
                        className="fhir-btn-small fhir-btn-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAddressLine}
                className="fhir-btn-small fhir-btn-success"
              >
                Add Address Line
              </button>
            </div>

            <div className="fhir-grid-2 fhir-field-spacing">
              <div>
                <label className="fhir-label-small">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="fhir-input"
                />
              </div>
            </div>

            <div className="fhir-grid-2">
              <div>
                <label className="fhir-label-small">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="fhir-input"
                />
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      <div className="fhir-form-wrapper-actions">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`fhir-form-submit-btn ${isCreating ? 'fhir-form-submit-btn-create' : 'fhir-form-submit-btn-edit'}`}
        >
          {isSubmitting
            ? (isCreating ? "Creating..." : "Saving...")
            : (isCreating ? "Create Organization" : "Save Changes")}
        </button>
      </div>
    </div>
  );
} 