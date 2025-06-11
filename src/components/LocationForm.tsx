import { useState, useEffect } from 'react';
import type { Location } from '@medplum/fhirtypes';
import { OrganizationPicker } from './OrganizationPicker';

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
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "1rem", 
      backgroundColor: "#f8f9fa",
      borderRadius: "8px", 
      border: "1px solid #e9ecef" 
    }}>
      <h2 style={{ 
        marginBottom: "1.5rem", 
        color: "#495057",
        borderBottom: "2px solid #007bff", 
        paddingBottom: "0.5rem" 
      }}>
        {isCreating ? "Create New Location" : "Edit Location"}
      </h2>
      
      {error && (
        <div style={{ 
          color: "#dc3545", 
          padding: "1rem", 
          backgroundColor: "#f8d7da", 
          border: "1px solid #f5c6cb", 
          borderRadius: "4px", 
          marginBottom: "1.5rem" 
        }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        backgroundColor: "white",
        padding: "2rem", 
        borderRadius: "8px", 
        border: "1px solid #e9ecef"
      }}>
        {/* Basic Information */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Basic Information</legend>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Name <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Status <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended' | 'inactive')}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'instance' | 'kind' | '')}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              >
                <option value="">Select mode...</option>
                <option value="instance">Instance</option>
                <option value="kind">Kind</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Managing Organization
              </label>
              <OrganizationPicker 
                value={managingOrgRef}
                onChange={(ref) => setManagingOrgRef(ref || '')}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "1rem",
                resize: "vertical"
              }}
            />
          </div>
        </fieldset>

        {/* Type */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Type</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>System</label>
              <input
                type="text"
                value={typeSystem}
                onChange={(e) => setTypeSystem(e.target.value)}
                placeholder="e.g., http://terminology.hl7.org/CodeSystem/v3-RoleCode"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Code</label>
              <input
                type="text"
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value)}
                placeholder="e.g., HOSP"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Display</label>
              <input
                type="text"
                value={typeDisplay}
                onChange={(e) => setTypeDisplay(e.target.value)}
                placeholder="e.g., Hospital"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
          </div>
        </fieldset>

        {/* Physical Type */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Physical Type</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>System</label>
              <input
                type="text"
                value={physicalTypeSystem}
                onChange={(e) => setPhysicalTypeSystem(e.target.value)}
                placeholder="e.g., http://terminology.hl7.org/CodeSystem/location-physical-type"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Code</label>
              <input
                type="text"
                value={physicalTypeCode}
                onChange={(e) => setPhysicalTypeCode(e.target.value)}
                placeholder="e.g., bu"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Display</label>
              <input
                type="text"
                value={physicalTypeDisplay}
                onChange={(e) => setPhysicalTypeDisplay(e.target.value)}
                placeholder="e.g., Building"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
          </div>
        </fieldset>

        {/* Address */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Address</legend>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Use</label>
              <select
                value={addressUse}
                onChange={(e) => setAddressUse(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              >
                <option value="">Select use...</option>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="temp">Temp</option>
                <option value="old">Old</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Type</label>
              <select
                value={addressType}
                onChange={(e) => setAddressType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              >
                <option value="">Select type...</option>
                <option value="postal">Postal</option>
                <option value="physical">Physical</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Address Lines</label>
            {addressLines.map((line, index) => (
              <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => handleAddressLineChange(index, e.target.value)}
                  placeholder={`Address line ${index + 1}`}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                />
                {addressLines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAddressLine(index)}
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddAddressLine}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Add Address Line
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "1rem"
                }}
              />
            </div>
          </div>
        </fieldset>

        {/* Telecom */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Contact Information</legend>
          
          {telecoms.map((telecom, index) => (
            <div key={index} style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 2fr 1fr auto", 
              gap: "0.5rem", 
              marginBottom: "1rem",
              alignItems: "end"
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>System</label>
                <select
                  value={telecom.system}
                  onChange={(e) => handleTelecomChange(index, 'system', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                >
                  <option value="">Select...</option>
                  <option value="phone">Phone</option>
                  <option value="fax">Fax</option>
                  <option value="email">Email</option>
                  <option value="url">URL</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Value</label>
                <input
                  type="text"
                  value={telecom.value}
                  onChange={(e) => handleTelecomChange(index, 'value', e.target.value)}
                  placeholder="Contact value"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Use</label>
                <select
                  value={telecom.use}
                  onChange={(e) => handleTelecomChange(index, 'use', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
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
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={handleAddTelecom}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Add Contact
          </button>
        </fieldset>

        {/* Submit Button */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isSubmitting ? "#6c757d" : "#007bff",
              color: "white",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease-in-out"
            }}
          >
            {isSubmitting ? "Saving..." : (isCreating ? "Create Location" : "Update Location")}
          </button>
        </div>
      </form>
    </div>
  );
} 