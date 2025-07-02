import { useState, useEffect } from 'react';
import type { PractitionerRole, QuestionnaireResponse } from '@medplum/fhirtypes';
import { SDCFormWrapper } from './SDCFormWrapper';
import practitionerRoleQuestionnaire from '../questionnaires/practitioner-role-questionnaire.json';
import { practitionerRoleToQuestionnaireResponse } from '../utils/practitionerRoleMapping';
import '../styles/components.css';

interface PractitionerRoleFormProps {
  initialPractitionerRole?: PractitionerRole;
  onSave: (qResp: QuestionnaireResponse) => Promise<QuestionnaireResponse>;
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
      // For new forms, start with a minimal response to avoid rendering issues
      const emptyResponse: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'in-progress',
        item: []
      };
      setInitialResponse(emptyResponse);
    }
  }, [initialPractitionerRole, preSelectedPractitioner, isCreating]);

  return (
    <SDCFormWrapper
      questionnaire={practitionerRoleQuestionnaire}
      initialResponse={initialResponse}
      onSave={onSave}
      isCreating={isCreating}
      resourceType="PractitionerRole"
    />
  );
} 