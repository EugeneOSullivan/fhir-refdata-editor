import { useState, useEffect } from 'react';
import type { Organization } from '@medplum/fhirtypes';
import { OrganizationPicker } from './OrganizationPicker';

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
        {isCreating ? "Create New Organization" : "Edit Organization"}
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
                Type
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g., Hospital, Clinic, Practice"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", color: "#495057" }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: "1.2rem", height: "1.2rem" }}
                />
                Active
              </label>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>
                Parent Organization
              </label>
              <OrganizationPicker 
                value={parentOrgRef}
                onChange={(ref) => setParentOrgRef(ref || '')}
              />
            </div>
          </div>
        </fieldset>

        {/* Identifiers */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Identifiers</legend>
          
          {identifiers.map((identifier, index) => (
            <div key={index} style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr auto", 
              gap: "0.5rem", 
              marginBottom: "1rem",
              alignItems: "end"
            }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>System</label>
                <input
                  type="text"
                  value={identifier.system}
                  onChange={(e) => handleIdentifierChange(index, 'system', e.target.value)}
                  placeholder="e.g., http://hl7.org/fhir/sid/us-npi"
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#495057" }}>Value</label>
                <input
                  type="text"
                  value={identifier.value}
                  onChange={(e) => handleIdentifierChange(index, 'value', e.target.value)}
                  placeholder="Identifier value"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "1rem"
                  }}
                />
              </div>
              {identifiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveIdentifier(index)}
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
            onClick={handleAddIdentifier}
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
            Add Identifier
          </button>
        </fieldset>

        {/* Contact Information */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Contact Information</legend>
          
          {telecoms.map((telecom, index) => (
            <div key={index} style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 2fr auto", 
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

        {/* Address */}
        <fieldset style={{ border: "2px solid #e9ecef", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
          <legend style={{ fontWeight: "bold", color: "#495057", padding: "0 0.5rem" }}>Address</legend>
          
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
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
            {isSubmitting ? "Saving..." : (isCreating ? "Create Organization" : "Update Organization")}
          </button>
        </div>
      </form>
    </div>
  );
} 