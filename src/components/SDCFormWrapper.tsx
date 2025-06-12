// src/components/SDCFormWrapper.tsx
// Removed unused import: import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { QuestionnaireResponse } from '@medplum/fhirtypes';
import { SmartFormsRenderer, useQuestionnaireResponseStore } from '@aehrc/smart-forms-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isEqual } from 'lodash';
// import type { Questionnaire } from 'fhir/r4';

// bundle renderer + theme + react-query
// const queryClient = new QueryClient();

// Create a new store instance for each form
// const createFormStore = () => {
//   const store = useQuestionnaireResponseStore.getState();
//   return {
//     ...store,
//     updatableResponse: null as QuestionnaireResponse | null
//   };
// };

// Wrapper component that manages its own store instance
function FormWrapper({ 
  questionnaire, 
  questionnaireResponse, 
  readOnly,
  onResponseChange 
}: { 
  questionnaire: Record<string, unknown>;
  questionnaireResponse: QuestionnaireResponse | null;
  readOnly: boolean;
  onResponseChange: (response: QuestionnaireResponse) => void;
}) {
  // Get the store instance
  const store = useQuestionnaireResponseStore.getState();

  // Initialize store with the initial response
  useEffect(() => {
    if (questionnaireResponse) {
      useQuestionnaireResponseStore.setState({ updatableResponse: questionnaireResponse });
    }
  }, [questionnaireResponse]); // Add dependency

  // Poll for store changes
  useEffect(() => {
    let lastResponse = store.updatableResponse;
    const interval = setInterval(() => {
      const currentResponse = store.updatableResponse;
      if (currentResponse && !isEqual(currentResponse, lastResponse)) {
        lastResponse = currentResponse;
        onResponseChange(currentResponse);
      }
    }, 100); // Poll every 100ms

    return () => clearInterval(interval);
  }, [store, onResponseChange]);

  // Update store when local response changes
  useEffect(() => {
    if (questionnaireResponse && !isEqual(store.updatableResponse, questionnaireResponse)) {
      useQuestionnaireResponseStore.setState({ updatableResponse: questionnaireResponse });
    }
  }, [questionnaireResponse, store]);

  return (
    <QueryClientProvider client={new QueryClient()}>
      <SmartFormsRenderer
        questionnaire={questionnaire}
        questionnaireResponse={questionnaireResponse}
        readOnly={readOnly}
      />
    </QueryClientProvider>
  );
}

interface SDCFormWrapperProps {
  questionnaire: Record<string, unknown>;
  initialResponse: QuestionnaireResponse | null;
  onSave: (qResp: QuestionnaireResponse) => Promise<QuestionnaireResponse>;
  isCreating?: boolean;
  resourceType?: string;
}

export function SDCFormWrapper({ questionnaire, initialResponse, onSave, isCreating = false, resourceType = "Practitioner" }: SDCFormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localResponse, setLocalResponse] = useState<QuestionnaireResponse | null>(null);

  // Initialize local state from initialResponse
  useEffect(() => {
    if (initialResponse && !localResponse) {
      setLocalResponse(initialResponse);
    }
  }, [initialResponse, localResponse]);

  const handleResponseChange = useCallback((newResponse: QuestionnaireResponse) => {
    setLocalResponse(newResponse);
  }, []);

  const handleSave = async () => {
    if (!localResponse) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get the latest response from the store before saving
      const storeResponse = useQuestionnaireResponseStore.getState().updatableResponse;
      const responseToSave = storeResponse || localResponse;
      const savedResponse = await onSave(responseToSave);
      
      // Update both local state and store with the saved response
      setLocalResponse(savedResponse);
      useQuestionnaireResponseStore.setState({ updatableResponse: savedResponse });
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questionnaire) {
    return <div>Loading questionnaire…</div>;
  }

  return (
    <div className="fhir-form-wrapper">
      <h2 className="fhir-form-wrapper-header">
        {isCreating ? `Create New ${resourceType}` : `Edit ${resourceType}`}
      </h2>
      
      {error && (
        <div className="fhir-form-wrapper-error">
          Error: {error}
        </div>
      )}

      <div className="fhir-form-wrapper-content">
        <FormWrapper
          questionnaire={questionnaire}
          questionnaireResponse={localResponse}
          readOnly={isSubmitting}
          onResponseChange={handleResponseChange}
        />
      </div>

      <div className="fhir-form-wrapper-actions">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className={`fhir-form-submit-btn ${isCreating ? 'fhir-form-submit-btn-create' : 'fhir-form-submit-btn-edit'}`}
        >
          {isSubmitting
            ? (isCreating ? "Creating..." : "Saving...")
            : (isCreating ? `Create ${resourceType}` : "Save Changes")}
        </button>
      </div>
    </div>
  );
}
