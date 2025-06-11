// src/App.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { SDCFormWrapper } from './components/SDCFormWrapper';
import { ResponseDisplay } from './components/ResponseDisplay';
import { PractitionerList } from './components/PractitionerList';
import type { Practitioner, QuestionnaireResponse } from '@medplum/fhirtypes';
// import type { Questionnaire } from 'fhir/r4';
import { fhirClient } from './fhirClient';
import { practitionerToQuestionnaireResponse, questionnaireResponseToPractitioner } from './utils/practitionerMapping';
import practitionerQ from './questionnaires/practitioner-questionnaire.json';
// import organisationQ from './questionnaires/organisation-questionnaire.json';

const SDCFormWrapperMemo = React.memo(SDCFormWrapper);

function App(): JSX.Element {
  const [type, setType] = useState<'Practitioner'|'Organisation'>('Practitioner');
  const [id, setId] = useState('');
  const [questionnaire, setQuestionnaire] = useState<Record<string, unknown> | null>(null);
  const [initialResponse, setInitialResponse] = useState<QuestionnaireResponse | null>(null);
  const [responseData, setResponseData] = useState<Practitioner | null>(null);
  const [showList, setShowList] = useState(true);
  const [currentPractitioner, setCurrentPractitioner] = useState<Practitioner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Memoize initialResponse so it is not recreated on every render
  const memoizedInitialResponse = useMemo(() => initialResponse, [initialResponse]);

  // Memoize the questionnaire prop to prevent unnecessary re-renders
  const memoizedQuestionnaire = useMemo(() => questionnaire, [questionnaire]);

  const loadForm = useCallback(async (practitionerId?: string) => {
    const targetId = practitionerId || id;
    if (!targetId && !isCreating) {
      setError('Please enter an ID');
      return;
    }
    
    setError(null);
    try {
      if (isCreating) {
        // For new practitioners, just set up the empty form
        setQuestionnaire(practitionerQ);
        return;
      }

      // Clear existing form state before loading new data
      setInitialResponse(null);
      setQuestionnaire(null);

      // Fetch the practitioner
      const practitioner = await fhirClient.get<Practitioner>(`Practitioner/${targetId}`);
      
      // Only update state if this is still the current practitioner we're loading
      if (practitioner.id === targetId) {
        setCurrentPractitioner(practitioner);
        
        // Convert to questionnaire response
        const qResponse = practitionerToQuestionnaireResponse(practitioner);
        setInitialResponse(qResponse);
        
        // Set the questionnaire
        setQuestionnaire(practitionerQ);
      }
    } catch (err) {
      console.error('Error loading practitioner:', err);
      setError(err instanceof Error ? err.message : 'Failed to load practitioner');
      // Clear form state on error
      setInitialResponse(null);
      setQuestionnaire(null);
    }
  }, [id, isCreating]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSave = useCallback(async (qResp: QuestionnaireResponse): Promise<QuestionnaireResponse> => {
    try {
      // Convert questionnaire response to practitioner
      const practitioner = questionnaireResponseToPractitioner(qResp);
      
      let savedPractitioner: Practitioner;
      
      if (isCreating) {
        // Create new practitioner
        savedPractitioner = await fhirClient.post<Practitioner>('Practitioner', practitioner);
        setIsCreating(false);
      } else {
        // Update existing practitioner
        if (!currentPractitioner) {
          throw new Error('No practitioner loaded');
        }
        // Ensure the ID is included in the request body
        practitioner.id = currentPractitioner.id;
        savedPractitioner = await fhirClient.put<Practitioner>(
          `Practitioner/${currentPractitioner.id}`,
          practitioner
        );
      }

      // Show the response data in the popup
      setResponseData(savedPractitioner);
      setCurrentPractitioner(savedPractitioner);
      setError(null);

      // If we just created a new practitioner, load it in edit mode
      if (isCreating) {
        setId(savedPractitioner.id || '');
        loadForm(savedPractitioner.id);
      }

      // Convert the saved practitioner back to a questionnaire response and return it
      return practitionerToQuestionnaireResponse(savedPractitioner);
    } catch (err) {
      console.error('Error saving practitioner:', err);
      setError(err instanceof Error ? err.message : 'Failed to save practitioner');
      throw err; // Re-throw to be handled by the form component
    }
  }, [isCreating, currentPractitioner, loadForm]);

  const handlePractitionerSelect = (practitioner: Practitioner) => {
    // Clear all state first
    setInitialResponse(null);
    setQuestionnaire(null);
    setResponseData(null);
    setError(null);
    
    // Then set new state
    setId(practitioner.id || '');
    setShowList(false);
    setCurrentPractitioner(practitioner);
    setIsCreating(false);
    
    // Load the form after state is cleared
    loadForm(practitioner.id);
  };

  const handleCreateNew = () => {
    setShowList(false);
    setCurrentPractitioner(null);
    setId('');
    setIsCreating(true);
    // Create an empty questionnaire response
    const emptyResponse: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'in-progress',
      item: []
    };
    setInitialResponse(emptyResponse);
    setQuestionnaire(practitionerQ);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>FHIR RefData SDC Editor</h1>
      
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '1rem',
          backgroundColor: '#fff3f3',
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          margin: '1rem 0'
        }}>
          Error: {error}
        </div>
      )}
      
      {showList ? (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={() => setShowList(false)}>Back to Form</button>
            <button 
              onClick={handleCreateNew}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create New Practitioner
            </button>
          </div>
          <PractitionerList onSelectPractitioner={handlePractitionerSelect} />
        </>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button onClick={() => setShowList(true)}>View All Practitioners</button>
          </div>
          {!isCreating && (
      <div>
        <label>
          Resource:&nbsp;
          <select value={type} onChange={e => setType(e.target.value as 'Practitioner' | 'Organisation')}>
            <option>Practitioner</option>
            <option>Organisation</option>
          </select>
        </label>
        &nbsp;
        <label>
          ID:&nbsp;
          <input value={id} onChange={e => setId(e.target.value)} />
        </label>
        &nbsp;
              <button onClick={() => loadForm()}>Load Form</button>
      </div>
          )}

      {memoizedQuestionnaire && (
        <SDCFormWrapperMemo
          questionnaire={memoizedQuestionnaire}
          initialResponse={memoizedInitialResponse}
          onSave={handleSave}
          isCreating={isCreating}
        />
      )}
        </>
      )}

      {responseData && (
        <ResponseDisplay 
          data={responseData} 
          onClose={() => setResponseData(null)} 
        />
      )}
    </div>
  );
}

export default App;
