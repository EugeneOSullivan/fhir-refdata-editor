// src/App.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { SDCFormWrapper } from './components/SDCFormWrapper';
import { ResponseDisplay } from './components/ResponseDisplay';
import { PractitionerList } from './components/PractitionerList';
import { OrganizationList } from './components/OrganizationList';
import { PractitionerRoleList } from './components/PractitionerRoleList';
import { PractitionerRoleForm } from './components/PractitionerRoleForm';
import { LocationList } from './components/LocationList';
import { LocationForm } from './components/LocationForm';
import { OrganizationForm } from './components/OrganizationForm';
import { Breadcrumb } from './components/Breadcrumb';
import type { QuestionnaireResponse } from '@medplum/fhirtypes';
// import type { Questionnaire } from 'fhir/r4';
import { fhirClient } from './fhirClient';
import { practitionerToQuestionnaireResponse, questionnaireResponseToPractitioner } from './utils/practitionerMapping';
import organizationQ from './questionnaires/organization-questionnaire.json';
import locationQ from './questionnaires/location-questionnaire.json';
import { organizationToQuestionnaireResponse, questionnaireResponseToOrganization } from './utils/organizationMapping';
import { locationToQuestionnaireResponse, questionnaireResponseToLocation } from './utils/locationMapping';

import practitionerQ from './questionnaires/practitioner-questionnaire.json';
// import organisationQ from './questionnaires/organisation-questionnaire.json';

const SDCFormWrapperMemo = React.memo(SDCFormWrapper);

function App(): JSX.Element {
  const [mode, setMode] = useState<'landing'|'Practitioner'|'Organization'|'PractitionerRole'|'Location'>('landing');
  const [type, setType] = useState<'Practitioner'|'Organization'|'PractitionerRole'|'Location'>('Practitioner');
  const [id, setId] = useState('');
  const [questionnaire, setQuestionnaire] = useState<Record<string, unknown> | null>(null);
  const [initialResponse, setInitialResponse] = useState<QuestionnaireResponse | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [showList, setShowList] = useState(true);
  const [currentResource, setCurrentResource] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [preSelectedPractitioner, setPreSelectedPractitioner] = useState<any>(null);

  // Memoize initialResponse so it is not recreated on every render
  const memoizedInitialResponse = useMemo(() => initialResponse, [initialResponse]);

  // Memoize the questionnaire prop to prevent unnecessary re-renders
  const memoizedQuestionnaire = useMemo(() => questionnaire, [questionnaire]);

  // Handler for landing page selection
  const handleLandingSelect = (resource: 'Practitioner' | 'Organization' | 'PractitionerRole' | 'Location') => {
    setMode(resource);
    setType(resource);
    setShowList(true);
    setCurrentResource(null);
    setId('');
    setIsCreating(false);
    setError(null);
    setQuestionnaire(null);
    setInitialResponse(null);
    setResponseData(null);
    setPreSelectedPractitioner(null);
  };

  // Load form for Practitioner or Organization
  const loadForm = useCallback(async (resourceId?: string) => {
    const targetId = resourceId || id;
    if (!targetId && !isCreating) {
      setError('Please enter an ID');
      return;
    }
    setError(null);
    try {
      if (isCreating) {
        if (type === 'Practitioner') {
          setQuestionnaire(practitionerQ);
        } else if (type === 'Organization') {
          setQuestionnaire(organizationQ);
        } else if (type === 'Location') {
          setQuestionnaire(locationQ);
        }
        return;
      }
      setInitialResponse(null);
      setQuestionnaire(null);
      if (type === 'Practitioner') {
        const practitioner = await fhirClient.get<any>(`Practitioner/${targetId}`);
        if (practitioner.id === targetId) {
          setCurrentResource(practitioner);
          setInitialResponse(practitionerToQuestionnaireResponse(practitioner));
          setQuestionnaire(practitionerQ);
        }
      } else if (type === 'Organization') {
        const organization = await fhirClient.get<any>(`Organization/${targetId}`);
        if (organization.id === targetId) {
          setCurrentResource(organization);
          setInitialResponse(organizationToQuestionnaireResponse(organization));
          setQuestionnaire(organizationQ);
        }
      } else if (type === 'Location') {
        const location = await fhirClient.get<any>(`Location/${targetId}`);
        if (location.id === targetId) {
          setCurrentResource(location);
          setInitialResponse(locationToQuestionnaireResponse(location));
          setQuestionnaire(locationQ);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resource');
      setInitialResponse(null);
      setQuestionnaire(null);
    }
  }, [id, isCreating, type]);

  // Save handler for PractitionerRole (direct FHIR resource)
  const handlePractitionerRoleSave = useCallback(async (practitionerRole: any): Promise<any> => {
    try {
      let savedResource: any;
      if (isCreating) {
        savedResource = await fhirClient.post<any>('PractitionerRole', practitionerRole);
        setIsCreating(false);
        setId(savedResource.id || '');
        setShowList(false);
      } else {
        if (!currentResource) throw new Error('No practitioner role loaded');
        practitionerRole.id = currentResource.id;
        savedResource = await fhirClient.put<any>(`PractitionerRole/${currentResource.id}`, practitionerRole);
      }
      setResponseData(savedResource);
      setCurrentResource(savedResource);
      setError(null);
      return savedResource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save practitioner role');
      throw err;
    }
  }, [isCreating, currentResource]);

  // Save handler for Location (direct FHIR resource)
  const handleLocationSave = useCallback(async (location: any): Promise<any> => {
    try {
      let savedResource: any;
      if (isCreating) {
        savedResource = await fhirClient.post<any>('Location', location);
        setIsCreating(false);
        setId(savedResource.id || '');
        setShowList(false);
      } else {
        if (!currentResource) throw new Error('No location loaded');
        location.id = currentResource.id;
        savedResource = await fhirClient.put<any>(`Location/${currentResource.id}`, location);
      }
      setResponseData(savedResource);
      setCurrentResource(savedResource);
      setError(null);
      return savedResource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
      throw err;
    }
  }, [isCreating, currentResource]);

  // Save handler for Organization (direct FHIR resource)
  const handleOrganizationSave = useCallback(async (organization: any): Promise<any> => {
    try {
      let savedResource: any;
      if (isCreating) {
        savedResource = await fhirClient.post<any>('Organization', organization);
        setIsCreating(false);
        setId(savedResource.id || '');
        setShowList(false);
      } else {
        if (!currentResource) throw new Error('No organization loaded');
        organization.id = currentResource.id;
        savedResource = await fhirClient.put<any>(`Organization/${currentResource.id}`, organization);
      }
      setResponseData(savedResource);
      setCurrentResource(savedResource);
      setError(null);
      return savedResource;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization');
      throw err;
    }
  }, [isCreating, currentResource]);

  // Save handler for Practitioner or Organization
  const handleSave = useCallback(async (qResp: QuestionnaireResponse): Promise<QuestionnaireResponse> => {
    try {
      let savedResource: any;
      if (type === 'Practitioner') {
        const practitioner = questionnaireResponseToPractitioner(qResp);
        if (isCreating) {
          savedResource = await fhirClient.post<any>('Practitioner', practitioner);
          setIsCreating(false);
        } else {
          if (!currentResource) throw new Error('No practitioner loaded');
          practitioner.id = currentResource.id;
          savedResource = await fhirClient.put<any>(`Practitioner/${currentResource.id}`, practitioner);
        }
      } else if (type === 'Organization') {
        const organization = questionnaireResponseToOrganization(qResp);
        if (isCreating) {
          savedResource = await fhirClient.post<any>('Organization', organization);
          setIsCreating(false);
        } else {
          if (!currentResource) throw new Error('No organization loaded');
          organization.id = currentResource.id;
          savedResource = await fhirClient.put<any>(`Organization/${currentResource.id}`, organization);
        }
      } else if (type === 'Location') {
        const location = questionnaireResponseToLocation(qResp);
        if (isCreating) {
          savedResource = await fhirClient.post<any>('Location', location);
          setIsCreating(false);
        } else {
          if (!currentResource) throw new Error('No location loaded');
          location.id = currentResource.id;
          savedResource = await fhirClient.put<any>(`Location/${currentResource.id}`, location);
        }
      }
      setResponseData(savedResource);
      setCurrentResource(savedResource);
      setError(null);
      if (isCreating) {
        setId(savedResource.id || '');
        loadForm(savedResource.id);
      }
      return type === 'Practitioner'
        ? practitionerToQuestionnaireResponse(savedResource)
        : type === 'Organization'
        ? organizationToQuestionnaireResponse(savedResource)
        : locationToQuestionnaireResponse(savedResource);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource');
      throw err;
    }
  }, [isCreating, currentResource, loadForm, type]);

  // List selection handlers
  const handlePractitionerSelect = (practitioner: any) => {
    setInitialResponse(null);
    setQuestionnaire(null);
    setResponseData(null);
    setError(null);
    setId(practitioner.id || '');
    setShowList(false);
    setCurrentResource(practitioner);
    setIsCreating(false);
    loadForm(practitioner.id);
  };
  const handleOrganizationSelect = (organization: any) => {
    setInitialResponse(null);
    setQuestionnaire(null);
    setResponseData(null);
    setError(null);
    setId(organization.id || '');
    setShowList(false);
    setCurrentResource(organization);
    setIsCreating(false);
    loadForm(organization.id);
  };
  const handlePractitionerRoleSelect = (practitionerRole: any) => {
    setInitialResponse(null);
    setQuestionnaire(null);
    setResponseData(null);
    setError(null);
    setId(practitionerRole.id || '');
    setShowList(false);
    setCurrentResource(practitionerRole);
    setIsCreating(false);
    // Don't call loadForm for PractitionerRole - we use direct form
  };
  
  const handleLocationSelect = (location: any) => {
    setInitialResponse(null);
    setQuestionnaire(null);
    setResponseData(null);
    setError(null);
    setId(location.id || '');
    setShowList(false);
    setCurrentResource(location);
    setIsCreating(false);
    // Don't call loadForm for Location - we use direct form
  };

  const handleCreateNewWithPractitioner = (practitioner: any) => {
    setShowList(false);
    setCurrentResource(null);
    setId('');
    setIsCreating(true);
    setPreSelectedPractitioner(practitioner);
    setInitialResponse(null);
    setQuestionnaire(null);
  };

  const handleCreateNew = () => {
    setShowList(false);
    setCurrentResource(null);
    setId('');
    setIsCreating(true);
    
    if (type === 'PractitionerRole' || type === 'Location' || type === 'Organization') {
      // For these types, we don't use questionnaire response - we use direct forms
      setInitialResponse(null);
      setQuestionnaire(null);
      setPreSelectedPractitioner(null);
    } else {
      const emptyResponse: QuestionnaireResponse = {
        resourceType: 'QuestionnaireResponse',
        status: 'in-progress',
        item: []
      };
      setInitialResponse(emptyResponse);
      setQuestionnaire(practitionerQ);
    }
  };

  // Generate breadcrumb items based on current state
  const getBreadcrumbItems = () => {
    const items = [
      { label: 'Home', onClick: mode === 'landing' ? undefined : () => setMode('landing') }
    ];

    if (mode !== 'landing') {
      const typeLabel = type === 'Practitioner' ? 'Practitioners' 
        : type === 'Organization' ? 'Organizations' 
        : type === 'Location' ? 'Locations'
        : 'Practitioner Roles';
      
      if (showList) {
        items.push({ label: typeLabel, onClick: undefined });
      } else {
        items.push({ 
          label: typeLabel, 
          onClick: () => setShowList(true) 
        });
        
        if (isCreating) {
          items.push({ label: `Create New ${type}`, onClick: undefined });
        } else if (currentResource) {
          items.push({ label: `Edit ${type}`, onClick: undefined });
        } else {
          items.push({ label: `Load ${type}`, onClick: undefined });
        }
      }
    }

    return items;
  };

  // Render
  return (
    <div style={{ 
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {mode !== 'landing' && (
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ maxWidth: 'none', width: '95%', margin: '0 auto' }}>
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
        </div>
      )}
      <div style={{ padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 'none', width: '95%', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '3rem', color: '#495057', fontSize: '2.5rem', fontWeight: '300' }}>FHIR RefData SDC Editor</h1>
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
          {mode === 'landing' && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2rem', 
              marginTop: '2rem' 
            }}>
              <button style={{ 
                fontSize: '1.2rem', 
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                minWidth: '250px'
              }} onClick={() => handleLandingSelect('Practitioner')}>Manage Practitioners</button>
              <button style={{ 
                fontSize: '1.2rem', 
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                minWidth: '250px'
              }} onClick={() => handleLandingSelect('Organization')}>Manage Organizations</button>
              <button style={{ 
                fontSize: '1.2rem', 
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                minWidth: '250px'
              }} onClick={() => handleLandingSelect('Location')}>Manage Locations</button>
              <button style={{ 
                fontSize: '1.2rem', 
                padding: '1rem 2rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                minWidth: '250px'
              }} onClick={() => handleLandingSelect('PractitionerRole')}>Manage Practitioner Roles</button>
            </div>
          )}
          {mode !== 'landing' && showList && (
            <div>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => setMode('landing')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Back to Home
            </button>
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
              {type === 'Practitioner' ? 'Create New Practitioner' 
               : type === 'Organization' ? 'Create New Organization' 
               : type === 'Location' ? 'Create New Location'
               : 'Create New Practitioner Role'}
            </button>
          </div>
                     {type === 'Practitioner' ? (
             <PractitionerList onSelectPractitioner={handlePractitionerSelect} />
           ) : type === 'Organization' ? (
             <OrganizationList onSelectOrganization={handleOrganizationSelect} />
           ) : type === 'Location' ? (
             <LocationList onSelectLocation={handleLocationSelect} />
           ) : (
             <PractitionerRoleList 
               onSelectPractitionerRole={handlePractitionerRoleSelect}
               onCreateNewWithPractitioner={handleCreateNewWithPractitioner}
             />
           )}
            </div>
          )}
          {mode !== 'landing' && !showList && (
            <>
                     <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <button 
               onClick={() => setShowList(true)}
               style={{
                 backgroundColor: '#6c757d',
                 color: 'white',
                 border: 'none',
                 padding: '0.5rem 1rem',
                 borderRadius: '4px',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem'
               }}
             >
               ← {type === 'Practitioner' ? 'Back to Practitioners' 
                  : type === 'Organization' ? 'Back to Organizations' 
                  : type === 'Location' ? 'Back to Locations'
                  : 'Back to Practitioner Roles'}
             </button>
           </div>
                    {!isCreating && type === 'Practitioner' && (
            <div>
              <label>
                Resource:&nbsp;
                <select value={type} onChange={e => setType(e.target.value as 'Practitioner' | 'Organization' | 'PractitionerRole' | 'Location')}>
                  <option>Practitioner</option>
                  <option>Organization</option>
                  <option>Location</option>
                  <option>PractitionerRole</option>
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
                               {type === 'PractitionerRole' ? (
            <PractitionerRoleForm
              initialPractitionerRole={currentResource}
              onSave={handlePractitionerRoleSave}
              isCreating={isCreating}
              preSelectedPractitioner={preSelectedPractitioner}
            />
          ) : type === 'Location' ? (
            <LocationForm
              initialLocation={currentResource}
              onSave={handleLocationSave}
              isCreating={isCreating}
            />
          ) : type === 'Organization' ? (
            <OrganizationForm
              initialOrganization={currentResource}
              onSave={handleOrganizationSave}
              isCreating={isCreating}
            />
          ) : memoizedQuestionnaire && (
            <SDCFormWrapperMemo
              questionnaire={memoizedQuestionnaire}
              initialResponse={memoizedInitialResponse}
              onSave={handleSave}
              isCreating={isCreating}
              resourceType={type}
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
      </div>
    </div>
  );
}

export default App;
