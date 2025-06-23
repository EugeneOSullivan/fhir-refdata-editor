import { useState, useEffect } from 'react';
import type { PractitionerRole, QuestionnaireResponse } from '@medplum/fhirtypes';
import { SDCFormWrapper } from './SDCFormWrapper';
import practitionerRoleQuestionnaire from '../questionnaires/practitioner-role-questionnaire.json';
import { practitionerRoleToQuestionnaireResponse, questionnaireResponseToPractitionerRole } from '../utils/practitionerRoleMapping';
import '../styles/components.css';

interface PractitionerRoleFormProps {
  initialPractitionerRole?: PractitionerRole;
  onSave: (practitionerRole: PractitionerRole) => Promise<PractitionerRole>;
  isCreating?: boolean;
  preSelectedPractitioner?: any;
}

export function PractitionerRoleForm({ initialPractitionerRole, onSave, isCreating = false, preSelectedPractitioner }: PractitionerRoleFormProps) {
  const [initialResponse, setInitialResponse] = useState<QuestionnaireResponse | null>(null);

  // Convert PractitionerRole to QuestionnaireResponse for the form
  useEffect(() => {
    if (initialPractitionerRole) {
      const response = practitionerRoleToQuestionnaireResponse(initialPractitionerRole);
      setInitialResponse(response);
    } else if (preSelectedPractitioner && isCreating) {
      // Pre-populate practitioner when creating new role
      const response = practitionerRoleToQuestionnaireResponse({
        resourceType: 'PractitionerRole',
        practitioner: { reference: `Practitioner/${preSelectedPractitioner.id}` }
      });
      setInitialResponse(response);
    } else {
      setInitialResponse(null);
    }
  }, [initialPractitionerRole, preSelectedPractitioner, isCreating]);

  // Handle saving by converting QuestionnaireResponse back to PractitionerRole
  const handleSave = async (response: QuestionnaireResponse): Promise<QuestionnaireResponse> => {
    const practitionerRole = questionnaireResponseToPractitionerRole(response);
    const savedPractitionerRole = await onSave(practitionerRole);
    const savedResponse = practitionerRoleToQuestionnaireResponse(savedPractitionerRole);
    return savedResponse;
  };

  return (
    <SDCFormWrapper
      questionnaire={practitionerRoleQuestionnaire}
      initialResponse={initialResponse}
      onSave={handleSave}
      isCreating={isCreating}
      resourceType="PractitionerRole"
    />
  );
} 