import type { PractitionerRole, QuestionnaireResponse, QuestionnaireResponseItem, CodeableConcept, Period } from '@medplum/fhirtypes';

export function practitionerRoleToQuestionnaireResponse(practitionerRole: PractitionerRole): QuestionnaireResponse {
  const response: QuestionnaireResponse = {
    resourceType: 'QuestionnaireResponse',
    status: 'in-progress',
    item: []
  };

  // Practitioner reference
  if (practitionerRole.practitioner?.reference) {
    response.item!.push({
      linkId: 'practitioner',
      text: 'Practitioner',
      answer: [{ valueString: practitionerRole.practitioner.reference }]
    });
  }

  // Organization reference
  if (practitionerRole.organization?.reference) {
    response.item!.push({
      linkId: 'organization',
      text: 'Managing Organization',
      answer: [{ valueString: practitionerRole.organization.reference }]
    });
  }

  // Code (role)
  if (practitionerRole.code && practitionerRole.code.length > 0) {
    practitionerRole.code.forEach((code) => {
      if (code.coding && code.coding.length > 0) {
        const coding = code.coding[0];
        response.item!.push({
          linkId: 'code',
          text: 'Role',
          item: [
            { linkId: 'code.coding.system', answer: coding.system ? [{ valueString: coding.system }] : [] },
            { linkId: 'code.coding.code', answer: coding.code ? [{ valueString: coding.code }] : [] },
            { linkId: 'code.coding.display', answer: coding.display ? [{ valueString: coding.display }] : [] }
          ]
        });
      }
    });
  }

  // Specialty
  if (practitionerRole.specialty && practitionerRole.specialty.length > 0) {
    practitionerRole.specialty.forEach((specialty) => {
      if (specialty.coding && specialty.coding.length > 0) {
        const coding = specialty.coding[0];
        response.item!.push({
          linkId: 'specialty',
          text: 'Specialty',
          item: [
            { linkId: 'specialty.coding.system', answer: coding.system ? [{ valueString: coding.system }] : [] },
            { linkId: 'specialty.coding.code', answer: coding.code ? [{ valueString: coding.code }] : [] },
            { linkId: 'specialty.coding.display', answer: coding.display ? [{ valueString: coding.display }] : [] }
          ]
        });
      }
    });
  }

  // Period
  if (practitionerRole.period) {
    response.item!.push({
      linkId: 'period',
      text: 'Period',
      item: [
        { linkId: 'period.start', answer: practitionerRole.period.start ? [{ valueDate: practitionerRole.period.start }] : [] },
        { linkId: 'period.end', answer: practitionerRole.period.end ? [{ valueDate: practitionerRole.period.end }] : [] }
      ]
    });
  }

  // Active
  if (practitionerRole.active !== undefined) {
    response.item!.push({
      linkId: 'active',
      text: 'Active',
      answer: [{ valueBoolean: practitionerRole.active }]
    });
  }

  return response;
}

function findAnswer(items: QuestionnaireResponseItem[] | undefined, linkId: string): string | boolean | undefined {
  if (!items) return undefined;
  const item = items.find(i => i.linkId === linkId);
  return item?.answer?.[0]?.valueString || item?.answer?.[0]?.valueBoolean || item?.answer?.[0]?.valueDate;
}

export function questionnaireResponseToPractitionerRole(response: QuestionnaireResponse): PractitionerRole {
  const practitionerRole: PractitionerRole = {
    resourceType: 'PractitionerRole'
  };

  // Practitioner reference
  const practitionerItem = response.item?.find(item => item.linkId === 'practitioner');
  if (practitionerItem?.answer?.[0]?.valueString) {
    practitionerRole.practitioner = { reference: practitionerItem.answer[0].valueString };
  }

  // Organization reference
  const organizationItem = response.item?.find(item => item.linkId === 'organization');
  if (organizationItem?.answer?.[0]?.valueString) {
    practitionerRole.organization = { reference: organizationItem.answer[0].valueString };
  }

  // Code (role)
  const codeGroups = response.item?.filter(item => item.linkId === 'code') || [];
  if (codeGroups.length > 0) {
    practitionerRole.code = codeGroups.map(group => {
      const system = findAnswer(group.item, 'code.coding.system');
      const code = findAnswer(group.item, 'code.coding.code');
      const display = findAnswer(group.item, 'code.coding.display');
      return {
        coding: [{
          system: typeof system === 'string' ? system : undefined,
          code: typeof code === 'string' ? code : undefined,
          display: typeof display === 'string' ? display : undefined
        }]
      } as CodeableConcept;
    });
  }

  // Specialty
  const specialtyGroups = response.item?.filter(item => item.linkId === 'specialty') || [];
  if (specialtyGroups.length > 0) {
    practitionerRole.specialty = specialtyGroups.map(group => {
      const system = findAnswer(group.item, 'specialty.coding.system');
      const code = findAnswer(group.item, 'specialty.coding.code');
      const display = findAnswer(group.item, 'specialty.coding.display');
      return {
        coding: [{
          system: typeof system === 'string' ? system : undefined,
          code: typeof code === 'string' ? code : undefined,
          display: typeof display === 'string' ? display : undefined
        }]
      } as CodeableConcept;
    });
  }

  // Period
  const periodGroup = response.item?.find(item => item.linkId === 'period');
  if (periodGroup && periodGroup.item) {
    const start = findAnswer(periodGroup.item, 'period.start');
    const end = findAnswer(periodGroup.item, 'period.end');
    practitionerRole.period = {
      start: typeof start === 'string' ? start : undefined,
      end: typeof end === 'string' ? end : undefined
    } as Period;
  }

  // Active
  const activeItem = response.item?.find(item => item.linkId === 'active');
  if (activeItem?.answer?.[0]?.valueBoolean !== undefined) {
    practitionerRole.active = activeItem.answer[0].valueBoolean;
  }

  return practitionerRole;
} 