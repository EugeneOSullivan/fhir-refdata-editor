// src/components/SDCFormWrapper.tsx
// Removed unused import: import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { QuestionnaireResponse } from '@medplum/fhirtypes';
import { SmartFormsRenderer, useQuestionnaireResponseStore } from '@aehrc/smart-forms-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PractitionerPicker } from './PractitionerPicker';
import { OrganizationPicker } from './OrganizationPicker';
import '../styles/components.css';
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

// Custom renderer for picker components
function CustomPickerRenderer({ 
  linkId, 
  text, 
  value, 
  onChange, 
  required = false 
}: { 
  linkId: string; 
  text: string; 
  value: string; 
  onChange: (value: string) => void; 
  required?: boolean;
}) {
  const handleChange = (reference: string | undefined) => {
    onChange(reference || '');
  };

  // Determine which picker to use based on linkId
  if (linkId === 'practitioner') {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 'bold',
          color: 'var(--fhir-text-color)'
        }}>
          {text} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
        <PractitionerPicker 
          value={value}
          onChange={handleChange}
          placeholder="Search for a practitioner..."
        />
      </div>
    );
  }

  if (linkId === 'organization' || linkId === 'partOf') {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 'bold',
          color: 'var(--fhir-text-color)'
        }}>
          {text} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
        <OrganizationPicker 
          value={value}
          onChange={handleChange}
          placeholder="Search for an organization..."
        />
      </div>
    );
  }

  // Fallback to regular input for other reference types
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontWeight: 'bold',
        color: 'var(--fhir-text-color)'
      }}>
        {text} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter reference..."
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '2px solid var(--fhir-input-border)',
          borderRadius: '6px',
          fontSize: '1rem',
          backgroundColor: 'var(--fhir-input-bg)',
          color: 'var(--fhir-text-color)'
        }}
      />
    </div>
  );
}

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
  }, [questionnaireResponse]);

  // Poll for store changes
  useEffect(() => {
    let lastResponse = store.updatableResponse;
    const interval = setInterval(() => {
      const currentResponse = store.updatableResponse;
      if (currentResponse && JSON.stringify(currentResponse) !== JSON.stringify(lastResponse)) {
        lastResponse = currentResponse;
        onResponseChange(currentResponse);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [store, onResponseChange]);

  // Update store when local response changes
  useEffect(() => {
    if (questionnaireResponse && JSON.stringify(store.updatableResponse) !== JSON.stringify(questionnaireResponse)) {
      useQuestionnaireResponseStore.setState({ updatableResponse: questionnaireResponse });
    }
  }, [questionnaireResponse, store]);

  // Check if questionnaire has reference fields that need custom rendering
  const hasReferenceFields = (questionnaire as any)?.item?.some((item: any) => 
    item.type === 'reference' || 
    (item.item && item.item.some((subItem: any) => subItem.type === 'reference'))
  );

  if (hasReferenceFields) {
    // Custom rendering for forms with picker components
    return (
      <div>
        <CustomFormRenderer 
          questionnaire={questionnaire}
          questionnaireResponse={questionnaireResponse}
          readOnly={readOnly}
          onResponseChange={onResponseChange}
        />
      </div>
    );
  }

  // Default SDC renderer for forms without picker components
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

// Custom form renderer for forms with picker components
function CustomFormRenderer({
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
  const [localResponse, setLocalResponse] = useState<QuestionnaireResponse | null>(questionnaireResponse);

  useEffect(() => {
    setLocalResponse(questionnaireResponse);
  }, [questionnaireResponse]);

  const handlePickerChange = useCallback((linkId: string, value: string) => {
    if (!localResponse) return;

    // Check if the item already exists
    const existingItem = localResponse.item?.find(item => item.linkId === linkId);
    
    let updatedResponse;
    if (existingItem) {
      // Update existing item
      updatedResponse = {
        ...localResponse,
        item: localResponse.item?.map(item => {
          if (item.linkId === linkId) {
            return {
              ...item,
              answer: value ? [{ valueReference: { reference: value } }] : []
            };
          }
          return item;
        }) || []
      };
    } else {
      // Add new item if it doesn't exist
      const newItem = {
        linkId: linkId,
        text: linkId === 'partOf' ? 'Parent Organization Reference' : 
              linkId === 'practitioner' ? 'Practitioner' : 
              linkId === 'organization' ? 'Managing Organization' : linkId,
        answer: value ? [{ valueReference: { reference: value } }] : []
      };
      
      updatedResponse = {
        ...localResponse,
        item: [...(localResponse.item || []), newItem]
      };
    }

    console.log(`handlePickerChange(${linkId}, ${value}):`, { existingItem, updatedResponse });
    setLocalResponse(updatedResponse);
    onResponseChange(updatedResponse);
  }, [localResponse, onResponseChange]);

  const getValueForLinkId = useCallback((linkId: string): string => {
    if (!localResponse?.item) return '';
    const item = localResponse.item.find(item => item.linkId === linkId);
    // Handle both valueReference and valueString formats for references
    return item?.answer?.[0]?.valueReference?.reference || 
           item?.answer?.[0]?.valueString || 
           '';
  }, [localResponse]);

  const renderQuestionnaireItem = useCallback((item: any): JSX.Element | null => {
    if (item.type === 'reference') {
      return (
        <CustomPickerRenderer
          key={item.linkId}
          linkId={item.linkId}
          text={item.text}
          value={getValueForLinkId(item.linkId)}
          onChange={(value) => handlePickerChange(item.linkId, value)}
          required={item.required}
        />
      );
    }

    // For other item types, we'll use the default SDC renderer
    return null;
  }, [getValueForLinkId, handlePickerChange]);

  // Render reference fields with custom pickers, then use SDC for the rest
  const referenceItems = (questionnaire as any)?.item?.filter((item: any) => item.type === 'reference') || [];
  const nonReferenceItems = (questionnaire as any)?.item?.filter((item: any) => item.type !== 'reference') || [];

  // Add debugging for SmartFormsRenderer
  console.log('CustomFormRenderer: Passing to SmartFormsRenderer:', {
    questionnaire: {
      ...questionnaire,
      item: nonReferenceItems
    },
    questionnaireResponse: localResponse,
    readOnly
  });

  return (
    <div>
      {/* Render reference fields with custom pickers */}
      {referenceItems.map(renderQuestionnaireItem)}
      
      {/* Render remaining items with SDC */}
      {nonReferenceItems.length > 0 && (
        <QueryClientProvider client={new QueryClient()}>
          <SmartFormsRenderer
            questionnaire={{
              ...questionnaire,
              item: nonReferenceItems
            }}
            questionnaireResponse={localResponse}
            readOnly={readOnly}
          />
        </QueryClientProvider>
      )}
    </div>
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
