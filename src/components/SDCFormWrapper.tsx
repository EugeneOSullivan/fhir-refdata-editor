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
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "1rem", 
      backgroundColor: "#f5f5f5", /* light gray background for the container */
      borderRadius: "8px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
    }}>
      <h2 style={{ 
        marginBottom: "1rem", 
        color: "#1a73e8", /* blue header */
        borderBottom: "1px solid #e0e0e0", 
        paddingBottom: "0.5rem" 
      }}>
        {isCreating ? `Create New ${resourceType}` : `Edit ${resourceType}`}
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

      <div style={{ 
        backgroundColor: "white", /* white inner content */
        padding: "1.5rem", 
        borderRadius: "4px", 
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)" 
      }}>
        <FormWrapper
          questionnaire={questionnaire}
          questionnaireResponse={localResponse}
          readOnly={isSubmitting}
          onResponseChange={handleResponseChange}
        />
      </div>

      <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          style={{
            backgroundColor: isCreating ? "#4CAF50" : "#1a73e8", /* blue (or green) button */
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
            : (isCreating ? `Create ${resourceType}` : "Save Changes")}
        </button>
      </div>
    </div>
  );
}
