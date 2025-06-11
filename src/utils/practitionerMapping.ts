import type { Practitioner, QuestionnaireResponse, QuestionnaireResponseItem, HumanName, ContactPoint, Identifier } from '@medplum/fhirtypes';

type NameUse = HumanName['use'];
type TelecomSystem = ContactPoint['system'];
type TelecomUse = ContactPoint['use'];
type Gender = Practitioner['gender'];

export function practitionerToQuestionnaireResponse(practitioner: Practitioner): QuestionnaireResponse {
  const response: QuestionnaireResponse = {
    resourceType: 'QuestionnaireResponse',
    status: 'in-progress',
    item: [] // Initialize as empty array
  };

  // Ensure response.item is initialized
  if (!response.item) {
    response.item = [];
  }

  // Names
  if (practitioner.name && practitioner.name.length > 0) {
    const nameItems: QuestionnaireResponseItem[] = [];
    practitioner.name.forEach((name) => {
      if (name.family) {
        const items: QuestionnaireResponseItem[] = [
          {
            linkId: 'name.use',
            answer: [{ valueString: name.use }]
          },
          {
            linkId: 'name.family',
            answer: [{ valueString: name.family }]
          }
        ];
        if (name.given && name.given.length > 0) {
          items.push({
            linkId: 'name.given',
            answer: name.given.map(given => ({ valueString: given }))
          });
        }
        if (name.prefix && name.prefix.length > 0) {
          items.push({
            linkId: 'name.prefix',
            answer: name.prefix.map(prefix => ({ valueString: prefix }))
          });
        }
        if (name.suffix && name.suffix.length > 0) {
          items.push({
            linkId: 'name.suffix',
            answer: name.suffix.map(suffix => ({ valueString: suffix }))
          });
        }
        nameItems.push({
          linkId: 'name',
          text: 'Name',
          item: items
        });
      }
    });
    if (response.item) {
      response.item.push(...nameItems);
    }
  }

  // Identifiers
  if (practitioner.identifier && practitioner.identifier.length > 0) {
    const identifierItems: QuestionnaireResponseItem[] = [];
    practitioner.identifier.forEach((identifier) => {
      identifierItems.push({
        linkId: 'identifier',
        text: 'Identifier',
        item: [
          {
            linkId: 'identifier.system',
            answer: [{ valueString: identifier.system }]
          },
          {
            linkId: 'identifier.value',
            answer: [{ valueString: identifier.value }]
          }
        ]
      });
    });
    if (response.item) {
      response.item.push(...identifierItems);
    }
  }

  // Telecom
  if (practitioner.telecom && practitioner.telecom.length > 0) {
    const telecomItems: QuestionnaireResponseItem[] = [];
    practitioner.telecom.forEach((telecom) => {
      telecomItems.push({
        linkId: 'telecom',
        text: 'Contact Information',
        item: [
          {
            linkId: 'telecom.system',
            answer: [{ valueString: telecom.system }]
          },
          {
            linkId: 'telecom.value',
            answer: [{ valueString: telecom.value }]
          },
          {
            linkId: 'telecom.use',
            answer: [{ valueString: telecom.use }]
          }
        ]
      });
    });
    if (response.item) {
      response.item.push(...telecomItems);
    }
  }

  // Gender
  if (practitioner.gender && response.item) {
    response.item.push({
      linkId: 'gender',
      text: 'Gender',
      answer: [{ valueString: practitioner.gender }]
    });
  }

  // Birth Date
  if (practitioner.birthDate && response.item) {
    response.item.push({
      linkId: 'birthDate',
      text: 'Birth Date',
      answer: [{ valueDate: practitioner.birthDate }]
    });
  }

  // Active
  if (practitioner.active !== undefined && response.item) {
    response.item.push({
      linkId: 'active',
      text: 'Active',
      answer: [{ valueBoolean: practitioner.active }]
    });
  }

  return response;
}

// Helper function to find an answer in a group of items
function findAnswer(items: QuestionnaireResponseItem[] | undefined, linkId: string): string | boolean | Date | undefined {
  if (!items) return undefined;
  const item = items.find(i => i.linkId === linkId);
  return item?.answer?.[0]?.valueString || item?.answer?.[0]?.valueBoolean || item?.answer?.[0]?.valueDate;
}

// Helper function to find a group of items
function findGroup(items: QuestionnaireResponseItem[] | undefined, linkId: string): QuestionnaireResponseItem | undefined {
  if (!items) return undefined;
  return items.find(i => i.linkId === linkId);
}

export function questionnaireResponseToPractitioner(response: QuestionnaireResponse): Practitioner {
  const practitioner: Practitioner = {
    resourceType: 'Practitioner'
  };

  // Process names
  const nameGroups = response.item?.filter(item => item.linkId === 'name') || [];
  if (nameGroups.length > 0) {
    practitioner.name = nameGroups.map(group => {
      const use = findAnswer(group.item, 'name.use') as NameUse;
      const family = findAnswer(group.item, 'name.family');
      // Extract given, prefix, suffix as arrays
      let given: string[] = [];
      let prefix: string[] = [];
      let suffix: string[] = [];
      if (group.item) {
        const givenItem = group.item.find(i => i.linkId === 'name.given');
        if (givenItem?.answer) {
          given = givenItem.answer.map(a => a.valueString).filter((v): v is string => typeof v === 'string');
        }
        const prefixItem = group.item.find(i => i.linkId === 'name.prefix');
        if (prefixItem?.answer) {
          prefix = prefixItem.answer.map(a => a.valueString).filter((v): v is string => typeof v === 'string');
        }
        const suffixItem = group.item.find(i => i.linkId === 'name.suffix');
        if (suffixItem?.answer) {
          suffix = suffixItem.answer.map(a => a.valueString).filter((v): v is string => typeof v === 'string');
        }
      }
      return { use, family, given, prefix, suffix } as HumanName;
    });
  }

  // Process identifiers
  const identifierGroups = response.item?.filter(item => item.linkId === 'identifier') || [];
  if (identifierGroups.length > 0) {
    practitioner.identifier = identifierGroups.map(group => {
      const system = findAnswer(group.item, 'identifier.system');
      const value = findAnswer(group.item, 'identifier.value');
      return { system, value } as Identifier;
    });
  }

  // Process telecom
  const telecomGroups = response.item?.filter(item => item.linkId === 'telecom') || [];
  if (telecomGroups.length > 0) {
    practitioner.telecom = telecomGroups.map(group => {
      const system = findAnswer(group.item, 'telecom.system') as TelecomSystem;
      const value = findAnswer(group.item, 'telecom.value');
      const use = findAnswer(group.item, 'telecom.use') as TelecomUse;
      return { system, value, use } as ContactPoint;
    });
  }

  // Process gender
  const genderItem = findGroup(response.item, 'gender');
  if (genderItem?.answer?.[0]?.valueString) {
    practitioner.gender = genderItem.answer[0].valueString as Gender;
  }

  // Process birth date
  const birthDateItem = findGroup(response.item, 'birthDate');
  if (birthDateItem?.answer?.[0]?.valueDate) {
    practitioner.birthDate = birthDateItem.answer[0].valueDate;
  }

  // Process active
  const activeItem = findGroup(response.item, 'active');
  if (activeItem?.answer?.[0]?.valueBoolean !== undefined) {
    practitioner.active = activeItem.answer[0].valueBoolean;
  }

  return practitioner;
} 