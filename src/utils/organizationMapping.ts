import type { Organization, QuestionnaireResponse, QuestionnaireResponseItem, ContactPoint, Identifier, Address } from '@medplum/fhirtypes';

export function organizationToQuestionnaireResponse(organization: Organization): QuestionnaireResponse {
  console.log('organizationToQuestionnaireResponse: Input:', JSON.stringify(organization, null, 2));
  const response: QuestionnaireResponse = {
    resourceType: 'QuestionnaireResponse',
    status: 'in-progress',
    item: []
  };

  // Name
  if (organization.name) {
    response.item!.push({
      linkId: 'name',
      text: 'Organization Name',
      answer: [{ valueString: organization.name }]
    });
  }

  // Identifiers
  if (organization.identifier && organization.identifier.length > 0) {
    organization.identifier.forEach((identifier) => {
      response.item!.push({
        linkId: 'identifier',
        text: 'Identifier',
        item: [
          { linkId: 'identifier.system', answer: [{ valueString: identifier.system }] },
          { linkId: 'identifier.value', answer: [{ valueString: identifier.value }] }
        ]
      });
    });
  }

  // Type
  if (organization.type && organization.type.length > 0 && organization.type[0].text) {
    response.item!.push({
      linkId: 'type',
      text: 'Type',
      answer: [{ valueString: organization.type[0].text }]
    });
  }

  // Telecom
  if (organization.telecom && organization.telecom.length > 0) {
    organization.telecom.forEach((telecom) => {
      response.item!.push({
        linkId: 'telecom',
        text: 'Contact Information',
        item: [
          { linkId: 'telecom.system', answer: [{ valueString: telecom.system }] },
          { linkId: 'telecom.value', answer: [{ valueString: telecom.value }] }
        ]
      });
    });
  }

  // Address
  if (organization.address && organization.address.length > 0) {
    const addr = organization.address[0];
    const addressItem: QuestionnaireResponseItem = {
      linkId: 'address',
      text: 'Address',
      item: []
    };
    
    // Handle address lines - create separate items for each line
    if (addr.line && addr.line.length > 0) {
      addr.line.forEach((line) => {
        addressItem.item!.push({
          linkId: 'address.line',
          text: 'Street',
          answer: [{ valueString: line }]
        });
      });
    }
    
    // Add other address fields
    if (addr.city) {
      addressItem.item!.push({
        linkId: 'address.city',
        text: 'City',
        answer: [{ valueString: addr.city }]
      });
    }
    if (addr.state) {
      addressItem.item!.push({
        linkId: 'address.state',
        text: 'State',
        answer: [{ valueString: addr.state }]
      });
    }
    if (addr.postalCode) {
      addressItem.item!.push({
        linkId: 'address.postalCode',
        text: 'Postal Code',
        answer: [{ valueString: addr.postalCode }]
      });
    }
    if (addr.country) {
      addressItem.item!.push({
        linkId: 'address.country',
        text: 'Country',
        answer: [{ valueString: addr.country }]
      });
    }
    
    // Only add the address group if it has items
    if (addressItem.item!.length > 0) {
      response.item!.push(addressItem);
    }
  }

  // Active
  if (organization.active !== undefined) {
    response.item!.push({
      linkId: 'active',
      text: 'Active',
      answer: [{ valueBoolean: organization.active }]
    });
  }

  // Parent Organization
  if (organization.partOf?.reference) {
    response.item!.push({
      linkId: 'partOf',
      text: 'Parent Organization Reference',
      answer: [{ valueReference: { reference: organization.partOf.reference } }]
    });
  }

  console.log('organizationToQuestionnaireResponse: Output:', JSON.stringify(response, null, 2));
  return response;
}

function findAnswer(items: QuestionnaireResponseItem[] | undefined, linkId: string): string | boolean | undefined {
  if (!items) return undefined;
  const item = items.find(i => i.linkId === linkId);
  return item?.answer?.[0]?.valueString || item?.answer?.[0]?.valueBoolean;
}

export function questionnaireResponseToOrganization(response: QuestionnaireResponse): Organization {
  const organization: Organization = {
    resourceType: 'Organization'
  };

  // Name
  const nameItem = response.item?.find(item => item.linkId === 'name');
  if (nameItem?.answer?.[0]?.valueString) {
    organization.name = nameItem.answer[0].valueString;
  }

  // Identifiers
  const identifierGroups = response.item?.filter(item => item.linkId === 'identifier') || [];
  if (identifierGroups.length > 0) {
    organization.identifier = identifierGroups.map(group => {
      const system = findAnswer(group.item, 'identifier.system');
      const value = findAnswer(group.item, 'identifier.value');
      return { system, value } as Identifier;
    });
  }

  // Type
  const typeItem = response.item?.find(item => item.linkId === 'type');
  if (typeItem?.answer?.[0]?.valueString) {
    organization.type = [{ text: typeItem.answer[0].valueString }];
  }

  // Telecom
  const telecomGroups = response.item?.filter(item => item.linkId === 'telecom') || [];
  if (telecomGroups.length > 0) {
    organization.telecom = telecomGroups.map(group => {
      const system = findAnswer(group.item, 'telecom.system');
      const value = findAnswer(group.item, 'telecom.value');
      return { system, value } as ContactPoint;
    });
  }

  // Address
  const addressGroup = response.item?.find(item => item.linkId === 'address');
  if (addressGroup && addressGroup.item) {
    // Collect all address lines
    const lineItems = addressGroup.item.filter(i => i.linkId === 'address.line');
    const lines = lineItems.map(item => item.answer?.[0]?.valueString).filter((v): v is string => typeof v === 'string');
    
    const city = findAnswer(addressGroup.item, 'address.city');
    const state = findAnswer(addressGroup.item, 'address.state');
    const postalCode = findAnswer(addressGroup.item, 'address.postalCode');
    const country = findAnswer(addressGroup.item, 'address.country');
    
    organization.address = [{
      line: lines.length > 0 ? lines : undefined,
      city: typeof city === 'string' ? city : undefined,
      state: typeof state === 'string' ? state : undefined,
      postalCode: typeof postalCode === 'string' ? postalCode : undefined,
      country: typeof country === 'string' ? country : undefined
    } as Address];
  }

  // Active
  const activeItem = response.item?.find(item => item.linkId === 'active');
  if (activeItem?.answer?.[0]?.valueBoolean !== undefined) {
    organization.active = activeItem.answer[0].valueBoolean;
  }

  // Parent Organization
  const partOfItem = response.item?.find(item => item.linkId === 'partOf');
  if (partOfItem?.answer?.[0]?.valueReference) {
    organization.partOf = {
      reference: partOfItem.answer[0].valueReference.reference
    };
  }

  return organization;
} 