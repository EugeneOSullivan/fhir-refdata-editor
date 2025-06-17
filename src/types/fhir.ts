import type { 
  Practitioner, 
  Organization, 
  Location, 
  PractitionerRole,
  QuestionnaireResponse,
  Questionnaire,
  Bundle,
  Resource
} from '@medplum/fhirtypes';

// Common FHIR resource types
export type FhirResource = Practitioner | Organization | Location | PractitionerRole;

// FHIR Bundle types for list responses
export type FhirBundle<T extends Resource> = Bundle<T>;

// Form state types
export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  data: FhirResource | null;
}

// List state types
export interface ListState<T extends FhirResource> {
  items: T[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
}

// App state types
export interface AppState {
  mode: 'landing' | 'Practitioner' | 'Organization' | 'PractitionerRole' | 'Location';
  type: 'Practitioner' | 'Organization' | 'PractitionerRole' | 'Location';
  id: string;
  questionnaire: Questionnaire | null;
  initialResponse: QuestionnaireResponse | null;
  responseData: FhirResource | null;
  showList: boolean;
  currentResource: FhirResource | null;
  error: string | null;
  isCreating: boolean;
  preSelectedPractitioner: Practitioner | null;
}

// Save handler types
export type SaveHandler<T extends FhirResource> = (resource: T) => Promise<T>;

// Selection handler types
export type SelectionHandler<T extends FhirResource> = (resource: T) => void; 