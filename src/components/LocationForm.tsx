import { useState, useEffect } from 'react';
import type { Location, QuestionnaireResponse } from '@medplum/fhirtypes';
import { SDCFormWrapper } from './SDCFormWrapper';
import locationQuestionnaire from '../questionnaires/location-questionnaire.json';
import { locationToQuestionnaireResponse, questionnaireResponseToLocation } from '../utils/locationMapping';
import '../styles/components.css';

interface LocationFormProps {
  initialLocation?: Location;
  onSave: (location: Location) => Promise<Location>;
  isCreating?: boolean;
}

export function LocationForm({ initialLocation, onSave, isCreating = false }: LocationFormProps) {
  const [initialResponse, setInitialResponse] = useState<QuestionnaireResponse | null>(null);

  // Convert Location to QuestionnaireResponse for the form
  useEffect(() => {
    if (initialLocation) {
      const response = locationToQuestionnaireResponse(initialLocation);
      setInitialResponse(response);
    } else {
      setInitialResponse(null);
    }
  }, [initialLocation]);

  // Handle saving by converting QuestionnaireResponse back to Location
  const handleSave = async (response: QuestionnaireResponse): Promise<QuestionnaireResponse> => {
    const location = questionnaireResponseToLocation(response);
    const savedLocation = await onSave(location);
    const savedResponse = locationToQuestionnaireResponse(savedLocation);
    return savedResponse;
  };

  return (
    <SDCFormWrapper
      questionnaire={locationQuestionnaire}
      initialResponse={initialResponse}
      onSave={handleSave}
      isCreating={isCreating}
      resourceType="Location"
    />
  );
} 