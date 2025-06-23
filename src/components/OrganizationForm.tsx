import { useState, useEffect } from 'react';
import type { Organization, QuestionnaireResponse } from '@medplum/fhirtypes';
import { SDCFormWrapper } from './SDCFormWrapper';
import organizationQuestionnaire from '../questionnaires/organization-questionnaire.json';
import { organizationToQuestionnaireResponse, questionnaireResponseToOrganization } from '../utils/organizationMapping';
import '../styles/components.css';

interface OrganizationFormProps {
  initialOrganization?: Organization;
  onSave: (organization: Organization) => Promise<Organization>;
  isCreating?: boolean;
}

export function OrganizationForm({ initialOrganization, onSave, isCreating = false }: OrganizationFormProps) {
  const [initialResponse, setInitialResponse] = useState<QuestionnaireResponse | null>(null);

  // Convert Organization to QuestionnaireResponse for the form
  useEffect(() => {
    if (initialOrganization) {
      const response = organizationToQuestionnaireResponse(initialOrganization);
      setInitialResponse(response);
    } else {
      setInitialResponse(null);
    }
  }, [initialOrganization]);

  // Handle saving by converting QuestionnaireResponse back to Organization
  const handleSave = async (response: QuestionnaireResponse): Promise<QuestionnaireResponse> => {
    const organization = questionnaireResponseToOrganization(response);
    const savedOrganization = await onSave(organization);
    const savedResponse = organizationToQuestionnaireResponse(savedOrganization);
    return savedResponse;
  };

  return (
    <SDCFormWrapper
      questionnaire={organizationQuestionnaire}
      initialResponse={initialResponse}
      onSave={handleSave}
      isCreating={isCreating}
      resourceType="Organization"
    />
  );
} 