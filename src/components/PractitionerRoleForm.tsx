import { useState, useEffect } from 'react';
import type { PractitionerRole } from '@medplum/fhirtypes';
import { PractitionerPicker } from './PractitionerPicker';
import { OrganizationPicker } from './OrganizationPicker';

interface PractitionerRoleFormProps {
  initialPractitionerRole?: PractitionerRole;
  onSave: (practitionerRole: PractitionerRole) => Promise<PractitionerRole>;
  isCreating?: boolean;
  preSelectedPractitioner?: any;
}

export function PractitionerRoleForm({ initialPractitionerRole, onSave, isCreating = false, preSelectedPractitioner }: PractitionerRoleFormProps) {
  const [practitionerRef, setPractitionerRef] = useState<string>('');
  const [organizationRef, setOrganizationRef] = useState<string>('');
  const [roleSystem, setRoleSystem] = useState<string>('');
  const [roleCode, setRoleCode] = useState<string>('');
  const [roleDisplay, setRoleDisplay] = useState<string>('');
  const [specialtySystem, setSpecialtySystem] = useState<string>('');
  const [specialtyCode, setSpecialtyCode] = useState<string>('');
  const [specialtyDisplay, setSpecialtyDisplay] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with existing data
  useEffect(() => {
    if (initialPractitionerRole) {
      setPractitionerRef(initialPractitionerRole.practitioner?.reference || '');
      setOrganizationRef(initialPractitionerRole.organization?.reference || '');
      
      if (initialPractitionerRole.code && initialPractitionerRole.code.length > 0) {
        const coding = initialPractitionerRole.code[0].coding?.[0];
        setRoleSystem(coding?.system || '');
        setRoleCode(coding?.code || '');
        setRoleDisplay(coding?.display || '');
      }
      
      if (initialPractitionerRole.specialty && initialPractitionerRole.specialty.length > 0) {
        const coding = initialPractitionerRole.specialty[0].coding?.[0];
        setSpecialtySystem(coding?.system || '');
        setSpecialtyCode(coding?.code || '');
        setSpecialtyDisplay(coding?.display || '');
      }
      
      setPeriodStart(initialPractitionerRole.period?.start || '');
      setPeriodEnd(initialPractitionerRole.period?.end || '');
      setActive(initialPractitionerRole.active !== false);
    } else if (preSelectedPractitioner && isCreating) {
      // Pre-populate practitioner when creating new role
      setPractitionerRef(`Practitioner/${preSelectedPractitioner.id}`);
    }
  }, [initialPractitionerRole, preSelectedPractitioner, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!practitionerRef || !organizationRef) {
      setError('Practitioner and Organization are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const practitionerRole: PractitionerRole = {
        resourceType: 'PractitionerRole',
        ...(initialPractitionerRole?.id ? { id: initialPractitionerRole.id } : {}),
        practitioner: { reference: practitionerRef },
        organization: { reference: organizationRef },
        active
      };

      // Add code if provided
      if (roleCode || roleDisplay) {
        practitionerRole.code = [{
          coding: [{
            system: roleSystem || undefined,
            code: roleCode || undefined,
            display: roleDisplay || undefined
          }]
        }];
      }

      // Add specialty if provided
      if (specialtyCode || specialtyDisplay) {
        practitionerRole.specialty = [{
          coding: [{
            system: specialtySystem || undefined,
            code: specialtyCode || undefined,
            display: specialtyDisplay || undefined
          }]
        }];
      }

      // Add period if provided
      if (periodStart || periodEnd) {
        practitionerRole.period = {
          start: periodStart || undefined,
          end: periodEnd || undefined
        };
      }

      await onSave(practitionerRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save practitioner role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "1rem", 
      backgroundColor: "#f5f5f5",
      borderRadius: "8px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
    }}>
      <h2 style={{ 
        marginBottom: "1rem", 
        color: "#1a73e8",
        borderBottom: "1px solid #e0e0e0", 
        paddingBottom: "0.5rem" 
      }}>
        {isCreating ? "Create New Practitioner Role" : "Edit Practitioner Role"}
      </h2>
      
      {error && (
        <div style={{ 
          color: "red", 
          padding: "1rem", 
          backgroundColor: "#fff3f3", 
          border: "1px solid #ffcdd2", 
          borderRadius: "4px", 
          marginBottom: "1rem" 
        }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        backgroundColor: "white",
        padding: "1.5rem", 
        borderRadius: "4px", 
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)" 
      }}>
        {/* Practitioner Picker */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Practitioner <span style={{ color: "red" }}>*</span>
          </label>
          <PractitionerPicker 
            value={practitionerRef}
            onChange={(ref) => setPractitionerRef(ref || '')}
          />
        </div>

        {/* Organization Picker */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
            Organization <span style={{ color: "red" }}>*</span>
          </label>
          <OrganizationPicker 
            value={organizationRef}
            onChange={(ref) => setOrganizationRef(ref || '')}
          />
        </div>

        {/* Role */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "1rem", marginBottom: "1rem" }}>
          <legend style={{ fontWeight: "bold" }}>Role</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>System</label>
              <input
                type="text"
                value={roleSystem}
                onChange={(e) => setRoleSystem(e.target.value)}
                placeholder="e.g., http://snomed.info/sct"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Code</label>
              <input
                type="text"
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                placeholder="e.g., 309343006"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Display</label>
            <input
              type="text"
              value={roleDisplay}
              onChange={(e) => setRoleDisplay(e.target.value)}
              placeholder="e.g., Physician"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>
        </fieldset>

        {/* Specialty */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "1rem", marginBottom: "1rem" }}>
          <legend style={{ fontWeight: "bold" }}>Specialty</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>System</label>
              <input
                type="text"
                value={specialtySystem}
                onChange={(e) => setSpecialtySystem(e.target.value)}
                placeholder="e.g., http://snomed.info/sct"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Code</label>
              <input
                type="text"
                value={specialtyCode}
                onChange={(e) => setSpecialtyCode(e.target.value)}
                placeholder="e.g., 394802001"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem" }}>Display</label>
            <input
              type="text"
              value={specialtyDisplay}
              onChange={(e) => setSpecialtyDisplay(e.target.value)}
              placeholder="e.g., General medicine"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>
        </fieldset>

        {/* Period */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "1rem", marginBottom: "1rem" }}>
          <legend style={{ fontWeight: "bold" }}>Period</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Start Date</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>End Date</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
          </div>
        </fieldset>

        {/* Active */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span style={{ fontWeight: "bold" }}>Active</span>
          </label>
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isCreating ? "#4CAF50" : "#1a73e8",
              color: "white", 
              border: "none", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "4px", 
              fontSize: "1rem", 
              cursor: isSubmitting ? "not-allowed" : "pointer", 
              opacity: isSubmitting ? 0.7 : 1 
            }}
          >
            {isSubmitting
              ? (isCreating ? "Creating..." : "Saving...")
              : (isCreating ? "Create Practitioner Role" : "Save Changes")}
          </button>
        </div>
      </form>
    </div>
  );
} 