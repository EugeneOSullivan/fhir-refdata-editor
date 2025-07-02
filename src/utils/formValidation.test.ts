import { validateField, validateQuestionnaireResponse } from './formValidation';
import type { QuestionnaireResponse } from '@medplum/fhirtypes';

describe('formValidation', () => {
  it('validates required fields', () => {
    const error = validateField('', 'Name', { required: true });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/required/);
  });

  it('validates minLength', () => {
    const error = validateField('ab', 'ShortField', { minLength: 3 });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/at least 3 characters/);
  });

  it('validates maxLength', () => {
    const error = validateField('abcdef', 'LongField', { maxLength: 5 });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/no more than 5 characters/);
  });

  it('validates email', () => {
    const error = validateField('not-an-email', 'Email', { type: 'email' });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/valid email/);
    expect(validateField('test@example.com', 'Email', { type: 'email' })).toBeNull();
  });

  it('validates phone', () => {
    const error = validateField('123abc', 'Phone', { type: 'phone' });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/valid phone/);
    expect(validateField('+1234567890', 'Phone', { type: 'phone' })).toBeNull();
  });

  it('validates url', () => {
    const error = validateField('ftp://example.com', 'Website', { type: 'url' });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/valid URL/);
    expect(validateField('https://example.com', 'Website', { type: 'url' })).toBeNull();
  });

  it('validates FHIR reference', () => {
    const error = validateField('Practitioner', 'Reference', { type: 'reference', expectedReferenceType: 'Practitioner' });
    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/valid FHIR reference/);
    expect(validateField('Practitioner/123', 'Reference', { type: 'reference', expectedReferenceType: 'Practitioner' })).toBeNull();
    expect(validateField('Organization/123', 'Reference', { type: 'reference', expectedReferenceType: 'Practitioner' })).toBeTruthy();
  });

  it('validates a simple QuestionnaireResponse', () => {
    const questionnaire = {
      item: [
        { linkId: 'name', text: 'Name', type: 'string', required: true },
        { linkId: 'email', text: 'Email', type: 'string', validation: { pattern: 'email' } }
      ]
    };
    const response: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      item: [
        { linkId: 'name', answer: [{ valueString: '' }] },
        { linkId: 'email', answer: [{ valueString: 'not-an-email' }] }
      ]
    };
    const result = validateQuestionnaireResponse(response, questionnaire);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.map(e => e.field)).toContain('Name');
    expect(result.errors.map(e => e.field)).toContain('Email');
  });
}); 