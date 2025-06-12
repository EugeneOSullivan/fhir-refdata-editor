import { useState, useEffect } from 'react';
import type { Location } from '@medplum/fhirtypes';
import { OrganizationPicker } from './OrganizationPicker';
import '../styles/components.css';

interface LocationFormProps {
  initialLocation?: Location;
  onSave: (location: Location) => Promise<Location>;
  isCreating?: boolean;
}

export function LocationForm({ initialLocation, onSave, isCreating = false }: LocationFormProps) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'inactive'>('active');
  const [mode, setMode] = useState<'instance' | 'kind' | ''>('');
  
  // Type fields
  const [typeSystem, setTypeSystem] = useState<string>('');
  const [typeCode, setTypeCode] = useState<string>('');
  const [typeDisplay, setTypeDisplay] = useState<string>('');
  
  // Physical Type fields
  const [physicalTypeSystem, setPhysicalTypeSystem] = useState<string>('');
  const [physicalTypeCode, setPhysicalTypeCode] = useState<string>('');
  const [physicalTypeDisplay, setPhysicalTypeDisplay] = useState<string>('');
  
  // Address fields
  const [addressUse, setAddressUse] = useState<string>('');
  const [addressType, setAddressType] = useState<string>('');
  const [addressLines, setAddressLines] = useState<string[]>(['']);
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  
  // Telecom fields
  const [telecoms, setTelecoms] = useState<{system: string, value: string, use: string}[]>([{system: '', value: '', use: ''}]);
  
  // Managing Organization
  const [managingOrgRef, setManagingOrgRef] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with existing data
  useEffect(() => {
    if (initialLocation) {
      setName(initialLocation.name || '');
      setDescription(initialLocation.description || '');
      setStatus(initialLocation.status || 'active');
      setMode(initialLocation.mode || '');
      
      // Type
      const type = initialLocation.type?.[0]?.coding?.[0];
      setTypeSystem(type?.system || '');
      setTypeCode(type?.code || '');
      setTypeDisplay(type?.display || '');
      
      // Physical Type
      const physicalType = initialLocation.physicalType?.coding?.[0];
      setPhysicalTypeSystem(physicalType?.system || '');
      setPhysicalTypeCode(physicalType?.code || '');
      setPhysicalTypeDisplay(physicalType?.display || '');
      
      // Address
      const address = initialLocation.address;
      setAddressUse(address?.use || '');
      setAddressType(address?.type || '');
      setAddressLines(address?.line || ['']);
      setCity(address?.city || '');
      setDistrict(address?.district || '');
      setState(address?.state || '');
      setPostalCode(address?.postalCode || '');
      setCountry(address?.country || '');
      
      // Telecom
      if (initialLocation.telecom && initialLocation.telecom.length > 0) {
        setTelecoms(initialLocation.telecom.map(t => ({
          system: t.system || '',
          value: t.value || '',
          use: t.use || ''
        })));
      }
      
      // Managing Organization
      setManagingOrgRef(initialLocation.managingOrganization?.reference || '');
    }
  }, [initialLocation]);

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

  const handleAddTelecom = () => {
    setTelecoms([...telecoms, {system: '', value: '', use: ''}]);
  };

  const handleRemoveTelecom = (index: number) => {
    setTelecoms(telecoms.filter((_, i) => i !== index));
  };

  const handleTelecomChange = (index: number, field: 'system' | 'value' | 'use', value: string) => {
    const updated = [...telecoms];
    updated[index][field] = value;
    setTelecoms(updated);
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
      const location: Location = {
        resourceType: 'Location',
        ...(initialLocation?.id ? { id: initialLocation.id } : {}),
        name: name.trim(),
        status
      };

      // Description
      if (description.trim()) {
        location.description = description.trim();
      }

      // Mode
      if (mode) {
        location.mode = mode as 'instance' | 'kind';
      }

      // Type
      if (typeCode || typeDisplay) {
        location.type = [{
          coding: [{
            system: typeSystem || undefined,
            code: typeCode || undefined,
            display: typeDisplay || undefined
          }]
        }];
      }

      // Physical Type
      if (physicalTypeCode || physicalTypeDisplay) {
        location.physicalType = {
          coding: [{
            system: physicalTypeSystem || undefined,
            code: physicalTypeCode || undefined,
            display: physicalTypeDisplay || undefined
          }]
        };
      }

      // Address
      const hasAddressData = addressLines.some(line => line.trim()) || city || district || state || postalCode || country;
      if (hasAddressData) {
        location.address = {
          use: addressUse as any || undefined,
          type: addressType as any || undefined,
          line: addressLines.filter(line => line.trim()),
          city: city || undefined,
          district: district || undefined,
          state: state || undefined,
          postalCode: postalCode || undefined,
          country: country || undefined
        };
      }

      // Telecom
      const validTelecoms = telecoms.filter(t => t.value.trim());
      if (validTelecoms.length > 0) {
        location.telecom = validTelecoms.map(t => ({
          system: t.system as any || undefined,
          value: t.value,
          use: t.use as any || undefined
        }));
      }

      // Managing Organization
      if (managingOrgRef) {
        location.managingOrganization = {
          reference: managingOrgRef
        };
      }

      await onSave(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">
        {isCreating ? "Create New Location" : "Edit Location"}
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
                <label className="fhir-label-bold">
                  Status <span className="fhir-required">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'suspended' | 'inactive')}
                  className="fhir-select"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="fhir-grid-2 fhir-field-spacing">
              <div>
                <label className="fhir-label-bold">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'instance' | 'kind' | '')}
                  className="fhir-select"
                >
                  <option value="">Select mode...</option>
                  <option value="instance">Instance</option>
                  <option value="kind">Kind</option>
                </select>
              </div>
              <div>
                <label className="fhir-label-bold">Managing Organization</label>
                <OrganizationPicker 
                  value={managingOrgRef}
                  onChange={(ref) => setManagingOrgRef(ref || '')}
                />
              </div>
            </div>

            <div>
              <label className="fhir-label-bold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="fhir-textarea"
              />
            </div>
          </fieldset>

          {/* Type */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Type</legend>
            <div className="fhir-grid-3">
              <div>
                <label className="fhir-label-small">System</label>
                <input
                  type="text"
                  value={typeSystem}
                  onChange={(e) => setTypeSystem(e.target.value)}
                  placeholder="e.g., http://terminology.hl7.org/CodeSystem/v3-RoleCode"
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Code</label>
                <input
                  type="text"
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  placeholder="e.g., HOSP"
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Display</label>
                <input
                  type="text"
                  value={typeDisplay}
                  onChange={(e) => setTypeDisplay(e.target.value)}
                  placeholder="e.g., Hospital"
                  className="fhir-input"
                />
              </div>
            </div>
          </fieldset>

          {/* Physical Type */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Physical Type</legend>
            <div className="fhir-grid-3">
              <div>
                <label className="fhir-label-small">System</label>
                <input
                  type="text"
                  value={physicalTypeSystem}
                  onChange={(e) => setPhysicalTypeSystem(e.target.value)}
                  placeholder="e.g., http://terminology.hl7.org/CodeSystem/location-physical-type"
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Code</label>
                <input
                  type="text"
                  value={physicalTypeCode}
                  onChange={(e) => setPhysicalTypeCode(e.target.value)}
                  placeholder="e.g., bu"
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Display</label>
                <input
                  type="text"
                  value={physicalTypeDisplay}
                  onChange={(e) => setPhysicalTypeDisplay(e.target.value)}
                  placeholder="e.g., Building"
                  className="fhir-input"
                />
              </div>
            </div>
          </fieldset>

          {/* Address */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Address</legend>
            
            <div className="fhir-grid-2 fhir-field-spacing">
              <div>
                <label className="fhir-label-small">Use</label>
                <select
                  value={addressUse}
                  onChange={(e) => setAddressUse(e.target.value)}
                  className="fhir-select"
                >
                  <option value="">Select use...</option>
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="temp">Temporary</option>
                  <option value="old">Old</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
              <div>
                <label className="fhir-label-small">Type</label>
                <select
                  value={addressType}
                  onChange={(e) => setAddressType(e.target.value)}
                  className="fhir-select"
                >
                  <option value="">Select type...</option>
                  <option value="postal">Postal</option>
                  <option value="physical">Physical</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

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
                <label className="fhir-label-small">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="fhir-input"
                />
              </div>
            </div>

            <div className="fhir-grid-3">
              <div>
                <label className="fhir-label-small">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="fhir-input"
                />
              </div>
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

          {/* Telecom */}
          <fieldset className="fhir-fieldset fhir-section-spacing">
            <legend className="fhir-legend">Contact Information</legend>
            
            {telecoms.map((telecom, index) => (
              <div key={index} className="fhir-dynamic-section">
                <div className="fhir-dynamic-grid-4">
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
                  <div>
                    <label className="fhir-label-small">Use</label>
                    <select
                      value={telecom.use}
                      onChange={(e) => handleTelecomChange(index, 'use', e.target.value)}
                      className="fhir-select"
                    >
                      <option value="">Select...</option>
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="temp">Temp</option>
                      <option value="old">Old</option>
                      <option value="mobile">Mobile</option>
                    </select>
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
            : (isCreating ? "Create Location" : "Save Changes")}
        </button>
      </div>
    </div>
  );
} 