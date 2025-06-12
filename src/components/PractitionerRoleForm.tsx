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
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">
        {isCreating ? "Create New Practitioner Role" : "Edit Practitioner Role"}
      </h2>
      
      {error && (
        <div className="fhir-form-wrapper-error">
          Error: {error}
        </div>
      )}

      <div className="fhir-form-wrapper-content">
        <form onSubmit={handleSubmit}>
          {/* Practitioner Picker */}
          <div className="fhir-field-spacing">
            <label className="fhir-label-bold">
              Practitioner <span className="fhir-required">*</span>
            </label>
            <PractitionerPicker 
              value={practitionerRef}
              onChange={(ref) => setPractitionerRef(ref || '')}
            />
          </div>

          {/* Organization Picker */}
          <div className="fhir-field-spacing">
            <label className="fhir-label-bold">
              Organization <span className="fhir-required">*</span>
            </label>
            <OrganizationPicker 
              value={organizationRef}
              onChange={(ref) => setOrganizationRef(ref || '')}
            />
          </div>

          {/* Role */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Role</legend>
            <div className="fhir-grid-2 fhir-small-spacing">
              <div>
                <label className="fhir-label-small">System</label>
                <input
                  type="text"
                  value={roleSystem}
                  onChange={(e) => setRoleSystem(e.target.value)}
                  placeholder="e.g., http://snomed.info/sct"
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Code</label>
                <input
                  type="text"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  placeholder="e.g., 309343006"
                  className="fhir-input"
                />
              </div>
            </div>
            <div>
              <label className="fhir-label-small">Display</label>
              <input
                type="text"
                value={roleDisplay}
                onChange={(e) => setRoleDisplay(e.target.value)}
                placeholder="e.g., Physician"
                className="fhir-input"
              />
            </div>
          </fieldset>

          {/* Specialty */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Specialty</legend>
            <div className="fhir-grid-2 fhir-small-spacing">
              <div>
                <label className="fhir-label-small">System</label>
                <input
                  type="text"
                  value={specialtySystem}
                  onChange={(e) => setSpecialtySystem(e.target.value)}
                  placeholder="e.g., http://snomed.info/sct"
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">Code</label>
                <input
                  type="text"
                  value={specialtyCode}
                  onChange={(e) => setSpecialtyCode(e.target.value)}
                  placeholder="e.g., 394802001"
                  className="fhir-input"
                />
              </div>
            </div>
            <div>
              <label className="fhir-label-small">Display</label>
              <input
                type="text"
                value={specialtyDisplay}
                onChange={(e) => setSpecialtyDisplay(e.target.value)}
                placeholder="e.g., General medicine"
                className="fhir-input"
              />
            </div>
          </fieldset>

          {/* Period */}
          <fieldset className="fhir-fieldset">
            <legend className="fhir-legend">Period</legend>
            <div className="fhir-grid-2">
              <div>
                <label className="fhir-label-small">Start Date</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="fhir-input"
                />
              </div>
              <div>
                <label className="fhir-label-small">End Date</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="fhir-input"
                />
              </div>
            </div>
          </fieldset>

          {/* Active */}
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
            : (isCreating ? "Create Practitioner Role" : "Save Changes")}
        </button>
      </div>
    </div>
  );
} 