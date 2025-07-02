import type { QuestionnaireResponse, QuestionnaireResponseItem } from '@medplum/fhirtypes';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  linkId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Base validation rules for common FHIR fields
const validationRules = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        severity: 'error'
      };
    }
    return null;
  },

  minLength: (value: string, fieldName: string, min: number): ValidationError | null => {
    if (value && value.length < min) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${min} characters long`,
        severity: 'error'
      };
    }
    return null;
  },

  maxLength: (value: string, fieldName: string, max: number): ValidationError | null => {
    if (value && value.length > max) {
      return {
        field: fieldName,
        message: `${fieldName} must be no more than ${max} characters long`,
        severity: 'error'
      };
    }
    return null;
  },

  email: (value: string, fieldName: string): ValidationError | null => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        severity: 'error'
      };
    }
    return null;
  },

  phone: (value: string, fieldName: string): ValidationError | null => {
    if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid phone number`,
        severity: 'error'
      };
    }
    return null;
  },

  url: (value: string, fieldName: string): ValidationError | null => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid URL starting with http:// or https://`,
        severity: 'error'
      };
    }
    return null;
  },

  reference: (value: string, fieldName: string, expectedType?: string): ValidationError | null => {
    if (value && !value.includes('/')) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid FHIR reference (e.g., "ResourceType/id")`,
        severity: 'error'
      };
    }
    if (value && expectedType && !value.startsWith(expectedType + '/')) {
      return {
        field: fieldName,
        message: `${fieldName} must reference a ${expectedType}`,
        severity: 'error'
      };
    }
    return null;
  }
};

// Extract value from QuestionnaireResponse item
function getItemValue(item: QuestionnaireResponseItem): any {
  if (!item.answer || item.answer.length === 0) return null;
  
  const answer = item.answer[0];
  return answer.valueString || 
         answer.valueBoolean || 
         answer.valueInteger || 
         answer.valueDecimal || 
         answer.valueDate || 
         answer.valueDateTime || 
         answer.valueTime || 
         answer.valueUri || 
         answer.valueReference?.reference ||
         answer.valueCoding?.code ||
         answer.valueQuantity?.value ||
         null;
}

// Validate a single QuestionnaireResponse item
function validateItem(item: QuestionnaireResponseItem, questionnaire: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const value = getItemValue(item);
  
  // Find the corresponding questionnaire item for validation rules
  const questionnaireItem = findQuestionnaireItem(questionnaire, item.linkId);
  if (!questionnaireItem) return errors;

  // Required field validation
  if (questionnaireItem.required) {
    const requiredError = validationRules.required(value, questionnaireItem.text || item.linkId);
    if (requiredError) {
      errors.push({ ...requiredError, linkId: item.linkId });
    }
  }

  // Skip other validations if value is empty and not required
  if (!value) return errors;

  // String validations
  if (typeof value === 'string') {
    // Min length validation
    if (questionnaireItem.minLength) {
      const minLengthError = validationRules.minLength(value, questionnaireItem.text || item.linkId, questionnaireItem.minLength);
      if (minLengthError) {
        errors.push({ ...minLengthError, linkId: item.linkId });
      }
    }

    // Max length validation
    if (questionnaireItem.maxLength) {
      const maxLengthError = validationRules.maxLength(value, questionnaireItem.text || item.linkId, questionnaireItem.maxLength);
      if (maxLengthError) {
        errors.push({ ...maxLengthError, linkId: item.linkId });
      }
    }

    // Email validation
    if (questionnaireItem.type === 'string' && questionnaireItem.validation?.pattern === 'email') {
      const emailError = validationRules.email(value, questionnaireItem.text || item.linkId);
      if (emailError) {
        errors.push({ ...emailError, linkId: item.linkId });
      }
    }

    // Phone validation
    if (questionnaireItem.type === 'string' && questionnaireItem.validation?.pattern === 'phone') {
      const phoneError = validationRules.phone(value, questionnaireItem.text || item.linkId);
      if (phoneError) {
        errors.push({ ...phoneError, linkId: item.linkId });
      }
    }

    // URL validation
    if (questionnaireItem.type === 'uri') {
      const urlError = validationRules.url(value, questionnaireItem.text || item.linkId);
      if (urlError) {
        errors.push({ ...urlError, linkId: item.linkId });
      }
    }

    // Reference validation
    if (questionnaireItem.type === 'reference') {
      const expectedType = questionnaireItem.validation?.targetType;
      const referenceError = validationRules.reference(value, questionnaireItem.text || item.linkId, expectedType);
      if (referenceError) {
        errors.push({ ...referenceError, linkId: item.linkId });
      }
    }
  }

  return errors;
}

// Find questionnaire item by linkId (recursive)
function findQuestionnaireItem(questionnaire: any, linkId: string): any {
  if (!questionnaire.item) return null;
  
  for (const item of questionnaire.item) {
    if (item.linkId === linkId) return item;
    if (item.item) {
      const found = findQuestionnaireItem(item, linkId);
      if (found) return found;
    }
  }
  return null;
}

// Main validation function for QuestionnaireResponse
export function validateQuestionnaireResponse(
  response: QuestionnaireResponse, 
  questionnaire: any
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!response.item) {
    return {
      isValid: false,
      errors: [{
        field: 'form',
        message: 'Form has no data to validate',
        severity: 'error'
      }],
      warnings: []
    };
  }

  // Validate each item
  for (const item of response.item) {
    const itemErrors = validateItem(item, questionnaire);
    errors.push(...itemErrors.filter(e => e.severity === 'error'));
    warnings.push(...itemErrors.filter(e => e.severity === 'warning'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Real-time validation for a single field
export function validateField(
  value: any, 
  fieldName: string, 
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    type?: 'email' | 'phone' | 'url' | 'reference';
    expectedReferenceType?: string;
  }
): ValidationError | null {
  // Required validation
  if (rules.required) {
    const requiredError = validationRules.required(value, fieldName);
    if (requiredError) return requiredError;
  }

  // Skip other validations if value is empty and not required
  if (!value) return null;

  // String validations
  if (typeof value === 'string') {
    // Min length validation
    if (rules.minLength) {
      const minLengthError = validationRules.minLength(value, fieldName, rules.minLength);
      if (minLengthError) return minLengthError;
    }

    // Max length validation
    if (rules.maxLength) {
      const maxLengthError = validationRules.maxLength(value, fieldName, rules.maxLength);
      if (maxLengthError) return maxLengthError;
    }

    // Type-specific validations
    switch (rules.type) {
      case 'email':
        return validationRules.email(value, fieldName);
      case 'phone':
        return validationRules.phone(value, fieldName);
      case 'url':
        return validationRules.url(value, fieldName);
      case 'reference':
        return validationRules.reference(value, fieldName, rules.expectedReferenceType);
    }
  }

  return null;
}

// Get field-specific validation rules from questionnaire
export function getFieldValidationRules(questionnaire: any, linkId: string): any {
  const item = findQuestionnaireItem(questionnaire, linkId);
  if (!item) return {};

  return {
    required: item.required || false,
    minLength: item.minLength,
    maxLength: item.maxLength,
    type: item.type,
    expectedReferenceType: item.validation?.targetType
  };
} 