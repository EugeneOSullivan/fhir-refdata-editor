import type { PractitionerRole, QuestionnaireResponse, QuestionnaireResponseItem, CodeableConcept, Period } from '@medplum/fhirtypes';

export function practitionerRoleToQuestionnaireResponse(practitionerRole: PractitionerRole): QuestionnaireResponse {
  console.log('practitionerRoleToQuestionnaireResponse: Input:', JSON.stringify(practitionerRole, null, 2));
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
      answer: [{ valueReference: { reference: practitionerRole.practitioner.reference } }]
    });
  }

  // Organization reference
  if (practitionerRole.organization?.reference) {
    response.item!.push({
      linkId: 'organization',
      text: 'Managing Organization',
      answer: [{ valueReference: { reference: practitionerRole.organization.reference } }]
    });
  }

  // Code (roles) - handle multiple roles
  if (practitionerRole.code && practitionerRole.code.length > 0) {
    practitionerRole.code.forEach((code) => {
      if (code.coding && code.coding.length > 0) {
        const coding = code.coding[0];
        const codeItem: QuestionnaireResponseItem = {
          linkId: 'code',
          text: 'Roles',
          item: []
        };
        
        if (coding.system) {
          codeItem.item!.push({
            linkId: 'code.system',
            text: 'System',
            answer: [{ valueString: coding.system }]
          });
        }
        if (coding.code) {
          codeItem.item!.push({
            linkId: 'code.code',
            text: 'Code',
            answer: [{ valueString: coding.code }]
          });
        }
        if (coding.display) {
          codeItem.item!.push({
            linkId: 'code.display',
            text: 'Display',
            answer: [{ valueString: coding.display }]
          });
        }
        
        // Only add the code group if it has items
        if (codeItem.item!.length > 0) {
          response.item!.push(codeItem);
        }
      }
    });
  }

  // Specialty - handle multiple specialties
  if (practitionerRole.specialty && practitionerRole.specialty.length > 0) {
    practitionerRole.specialty.forEach((specialty) => {
      if (specialty.coding && specialty.coding.length > 0) {
        const coding = specialty.coding[0];
        const specialtyItem: QuestionnaireResponseItem = {
          linkId: 'specialty',
          text: 'Specialties',
          item: []
        };
        
        if (coding.system) {
          specialtyItem.item!.push({
            linkId: 'specialty.system',
            text: 'System',
            answer: [{ valueString: coding.system }]
          });
        }
        if (coding.code) {
          specialtyItem.item!.push({
            linkId: 'specialty.code',
            text: 'Code',
            answer: [{ valueString: coding.code }]
          });
        }
        if (coding.display) {
          specialtyItem.item!.push({
            linkId: 'specialty.display',
            text: 'Display',
            answer: [{ valueString: coding.display }]
          });
        }
        
        // Only add the specialty group if it has items
        if (specialtyItem.item!.length > 0) {
          response.item!.push(specialtyItem);
        }
      }
    });
  }

  // Period - single group
  if (practitionerRole.period) {
    const periodItem: QuestionnaireResponseItem = {
      linkId: 'period',
      text: 'Period',
      item: []
    };
    
    if (practitionerRole.period.start) {
      periodItem.item!.push({
        linkId: 'period.start',
        text: 'Start Date',
        answer: [{ valueDate: practitionerRole.period.start }]
      });
    }
    if (practitionerRole.period.end) {
      periodItem.item!.push({
        linkId: 'period.end',
        text: 'End Date',
        answer: [{ valueDate: practitionerRole.period.end }]
      });
    }
    
    // Only add the period group if it has items
    if (periodItem.item!.length > 0) {
      response.item!.push(periodItem);
    }
  }

  // Active
  if (practitionerRole.active !== undefined) {
    response.item!.push({
      linkId: 'active',
      text: 'Active',
      answer: [{ valueBoolean: practitionerRole.active }]
    });
  }

  console.log('practitionerRoleToQuestionnaireResponse: Output:', JSON.stringify(response, null, 2));
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
  if (practitionerItem?.answer?.[0]?.valueReference) {
    practitionerRole.practitioner = { reference: practitionerItem.answer[0].valueReference.reference };
  }

  // Organization reference
  const organizationItem = response.item?.find(item => item.linkId === 'organization');
  if (organizationItem?.answer?.[0]?.valueReference) {
    practitionerRole.organization = { reference: organizationItem.answer[0].valueReference.reference };
  }

  // Code (roles) - handle multiple roles
  const codeGroups = response.item?.filter(item => item.linkId === 'code') || [];
  if (codeGroups.length > 0) {
    practitionerRole.code = codeGroups.map(group => {
      const system = findAnswer(group.item, 'code.system');
      const code = findAnswer(group.item, 'code.code');
      const display = findAnswer(group.item, 'code.display');
      return {
        coding: [{
          system: typeof system === 'string' ? system : undefined,
          code: typeof code === 'string' ? code : undefined,
          display: typeof display === 'string' ? display : undefined
        }]
      } as CodeableConcept;
    });
  }

  // Specialty - handle multiple specialties
  const specialtyGroups = response.item?.filter(item => item.linkId === 'specialty') || [];
  if (specialtyGroups.length > 0) {
    practitionerRole.specialty = specialtyGroups.map(group => {
      const system = findAnswer(group.item, 'specialty.system');
      const code = findAnswer(group.item, 'specialty.code');
      const display = findAnswer(group.item, 'specialty.display');
      return {
        coding: [{
          system: typeof system === 'string' ? system : undefined,
          code: typeof code === 'string' ? code : undefined,
          display: typeof display === 'string' ? display : undefined
        }]
      } as CodeableConcept;
    });
  }

  // Period - single group
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