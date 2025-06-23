import type { Location, QuestionnaireResponse, QuestionnaireResponseItem } from '@medplum/fhirtypes';

export function locationToQuestionnaireResponse(location: Location): QuestionnaireResponse {
  const items: QuestionnaireResponseItem[] = [];

  // Name
  if (location.name) {
    items.push({
      linkId: 'name',
      answer: [{ valueString: location.name }]
    });
  }

  // Description
  if (location.description) {
    items.push({
      linkId: 'description',
      answer: [{ valueString: location.description }]
    });
  }

  // Status
  if (location.status) {
    items.push({
      linkId: 'status',
      answer: [{
        valueCoding: {
          system: 'http://hl7.org/fhir/location-status',
          code: location.status,
          display: location.status.charAt(0).toUpperCase() + location.status.slice(1)
        }
      }]
    });
  }

  // Mode
  if (location.mode) {
    items.push({
      linkId: 'mode',
      answer: [{
        valueCoding: {
          system: 'http://hl7.org/fhir/location-mode',
          code: location.mode,
          display: location.mode.charAt(0).toUpperCase() + location.mode.slice(1)
        }
      }]
    });
  }

  // Type
  if (location.type && location.type.length > 0 && location.type[0].coding && location.type[0].coding.length > 0) {
    const coding = location.type[0].coding[0];
    const typeItems: QuestionnaireResponseItem[] = [];
    
    if (coding.system) {
      typeItems.push({
        linkId: 'type.coding.system',
        answer: [{ valueString: coding.system }]
      });
    }
    
    if (coding.code) {
      typeItems.push({
        linkId: 'type.coding.code',
        answer: [{ valueString: coding.code }]
      });
    }
    
    if (coding.display) {
      typeItems.push({
        linkId: 'type.coding.display',
        answer: [{ valueString: coding.display }]
      });
    }

    if (typeItems.length > 0) {
      items.push({
        linkId: 'type',
        item: typeItems
      });
    }
  }

  // Telecom
  if (location.telecom && location.telecom.length > 0) {
    const telecomItems = location.telecom.map(telecom => {
      const telecomSubItems: QuestionnaireResponseItem[] = [];
      
      if (telecom.system) {
        telecomSubItems.push({
          linkId: 'telecom.system',
          answer: [{
            valueCoding: {
              system: 'http://hl7.org/fhir/contact-point-system',
              code: telecom.system,
              display: telecom.system.charAt(0).toUpperCase() + telecom.system.slice(1)
            }
          }]
        });
      }
      
      if (telecom.value) {
        telecomSubItems.push({
          linkId: 'telecom.value',
          answer: [{ valueString: telecom.value }]
        });
      }
      
      if (telecom.use) {
        telecomSubItems.push({
          linkId: 'telecom.use',
          answer: [{
            valueCoding: {
              system: 'http://hl7.org/fhir/contact-point-use',
              code: telecom.use,
              display: telecom.use.charAt(0).toUpperCase() + telecom.use.slice(1)
            }
          }]
        });
      }

      return {
        linkId: 'telecom',
        item: telecomSubItems
      };
    });

    items.push(...telecomItems);
  }

  // Address
  if (location.address) {
    const addressItems: QuestionnaireResponseItem[] = [];
    
    if (location.address.use) {
      addressItems.push({
        linkId: 'address.use',
        answer: [{
          valueCoding: {
            system: 'http://hl7.org/fhir/address-use',
            code: location.address.use,
            display: location.address.use.charAt(0).toUpperCase() + location.address.use.slice(1)
          }
        }]
      });
    }
    
    if (location.address.type) {
      addressItems.push({
        linkId: 'address.type',
        answer: [{
          valueCoding: {
            system: 'http://hl7.org/fhir/address-type',
            code: location.address.type,
            display: location.address.type.charAt(0).toUpperCase() + location.address.type.slice(1)
          }
        }]
      });
    }

    if (location.address.line && location.address.line.length > 0) {
      location.address.line.forEach(line => {
        addressItems.push({
          linkId: 'address.line',
          answer: [{ valueString: line }]
        });
      });
    }

    if (location.address.city) {
      addressItems.push({
        linkId: 'address.city',
        answer: [{ valueString: location.address.city }]
      });
    }

    if (location.address.district) {
      addressItems.push({
        linkId: 'address.district',
        answer: [{ valueString: location.address.district }]
      });
    }

    if (location.address.state) {
      addressItems.push({
        linkId: 'address.state',
        answer: [{ valueString: location.address.state }]
      });
    }

    if (location.address.postalCode) {
      addressItems.push({
        linkId: 'address.postalCode',
        answer: [{ valueString: location.address.postalCode }]
      });
    }

    if (location.address.country) {
      addressItems.push({
        linkId: 'address.country',
        answer: [{ valueString: location.address.country }]
      });
    }

    if (addressItems.length > 0) {
      items.push({
        linkId: 'address',
        item: addressItems
      });
    }
  }

  // Physical Type
  if (location.physicalType && location.physicalType.coding && location.physicalType.coding.length > 0) {
    const coding = location.physicalType.coding[0];
    const physicalTypeItems: QuestionnaireResponseItem[] = [];
    
    if (coding.system) {
      physicalTypeItems.push({
        linkId: 'physicalType.coding.system',
        answer: [{ valueString: coding.system }]
      });
    }
    
    if (coding.code) {
      physicalTypeItems.push({
        linkId: 'physicalType.coding.code',
        answer: [{ valueString: coding.code }]
      });
    }
    
    if (coding.display) {
      physicalTypeItems.push({
        linkId: 'physicalType.coding.display',
        answer: [{ valueString: coding.display }]
      });
    }

    if (physicalTypeItems.length > 0) {
      items.push({
        linkId: 'physicalType',
        item: physicalTypeItems
      });
    }
  }

  // Managing Organization
  if (location.managingOrganization?.reference) {
    items.push({
      linkId: 'managingOrganization',
      answer: [{ valueReference: { reference: location.managingOrganization.reference } }]
    });
  }

  return {
    resourceType: 'QuestionnaireResponse',
    status: 'completed',
    item: items
  };
}

export function questionnaireResponseToLocation(response: QuestionnaireResponse): Location {
  const location: Location = {
    resourceType: 'Location'
  };

  // Helper function to find items by linkId
  const findItem = (linkId: string, items: QuestionnaireResponseItem[] = response.item || []): QuestionnaireResponseItem | undefined => {
    return items.find(item => item.linkId === linkId);
  };

  // Helper function to find nested items
  const findNestedItem = (parentLinkId: string, childLinkId: string): QuestionnaireResponseItem | undefined => {
    const parent = findItem(parentLinkId);
    if (parent?.item) {
      return findItem(childLinkId, parent.item);
    }
    return undefined;
  };

  // Name
  const nameItem = findItem('name');
  if (nameItem?.answer?.[0]?.valueString) {
    location.name = nameItem.answer[0].valueString;
  }

  // Description
  const descriptionItem = findItem('description');
  if (descriptionItem?.answer?.[0]?.valueString) {
    location.description = descriptionItem.answer[0].valueString;
  }

  // Status
  const statusItem = findItem('status');
  if (statusItem?.answer?.[0]?.valueCoding?.code) {
    location.status = statusItem.answer[0].valueCoding.code as 'active' | 'suspended' | 'inactive';
  }

  // Mode
  const modeItem = findItem('mode');
  if (modeItem?.answer?.[0]?.valueCoding?.code) {
    location.mode = modeItem.answer[0].valueCoding.code as 'instance' | 'kind';
  }

  // Type
  const typeSystemItem = findNestedItem('type', 'type.coding.system');
  const typeCodeItem = findNestedItem('type', 'type.coding.code');
  const typeDisplayItem = findNestedItem('type', 'type.coding.display');
  
  if (typeCodeItem?.answer?.[0]?.valueString || typeDisplayItem?.answer?.[0]?.valueString) {
    location.type = [{
      coding: [{
        system: typeSystemItem?.answer?.[0]?.valueString,
        code: typeCodeItem?.answer?.[0]?.valueString,
        display: typeDisplayItem?.answer?.[0]?.valueString
      }]
    }];
  }

  // Telecom
  const telecomItems = response.item?.filter(item => item.linkId === 'telecom') || [];
  if (telecomItems.length > 0) {
    location.telecom = telecomItems.map(telecomItem => {
      const systemItem = findItem('telecom.system', telecomItem.item);
      const valueItem = findItem('telecom.value', telecomItem.item);
      const useItem = findItem('telecom.use', telecomItem.item);

      return {
        system: systemItem?.answer?.[0]?.valueCoding?.code as 'phone' | 'fax' | 'email' | 'url' | undefined,
        value: valueItem?.answer?.[0]?.valueString,
        use: useItem?.answer?.[0]?.valueCoding?.code as 'home' | 'work' | 'temp' | 'old' | 'mobile' | undefined
      };
    }).filter(telecom => telecom.value); // Only include telecom entries with values
  }

  // Address
  const addressUseItem = findNestedItem('address', 'address.use');
  const addressTypeItem = findNestedItem('address', 'address.type');
  const addressLineItems = response.item?.find(item => item.linkId === 'address')?.item?.filter(item => item.linkId === 'address.line') || [];
  const addressCityItem = findNestedItem('address', 'address.city');
  const addressDistrictItem = findNestedItem('address', 'address.district');
  const addressStateItem = findNestedItem('address', 'address.state');
  const addressPostalCodeItem = findNestedItem('address', 'address.postalCode');
  const addressCountryItem = findNestedItem('address', 'address.country');

  if (addressUseItem || addressTypeItem || addressLineItems.length > 0 || addressCityItem || addressDistrictItem || addressStateItem || addressPostalCodeItem || addressCountryItem) {
    location.address = {
      use: addressUseItem?.answer?.[0]?.valueCoding?.code as 'home' | 'work' | 'temp' | 'old' | undefined,
      type: addressTypeItem?.answer?.[0]?.valueCoding?.code as 'postal' | 'physical' | 'both' | undefined,
      line: addressLineItems.map(item => item.answer?.[0]?.valueString).filter(Boolean) as string[],
      city: addressCityItem?.answer?.[0]?.valueString,
      district: addressDistrictItem?.answer?.[0]?.valueString,
      state: addressStateItem?.answer?.[0]?.valueString,
      postalCode: addressPostalCodeItem?.answer?.[0]?.valueString,
      country: addressCountryItem?.answer?.[0]?.valueString
    };
  }

  // Physical Type
  const physicalTypeSystemItem = findNestedItem('physicalType', 'physicalType.coding.system');
  const physicalTypeCodeItem = findNestedItem('physicalType', 'physicalType.coding.code');
  const physicalTypeDisplayItem = findNestedItem('physicalType', 'physicalType.coding.display');
  
  if (physicalTypeCodeItem?.answer?.[0]?.valueString || physicalTypeDisplayItem?.answer?.[0]?.valueString) {
    location.physicalType = {
      coding: [{
        system: physicalTypeSystemItem?.answer?.[0]?.valueString,
        code: physicalTypeCodeItem?.answer?.[0]?.valueString,
        display: physicalTypeDisplayItem?.answer?.[0]?.valueString
      }]
    };
  }

  // Managing Organization
  const managingOrgItem = findItem('managingOrganization');
  if (managingOrgItem?.answer?.[0]?.valueReference?.reference) {
    location.managingOrganization = {
      reference: managingOrgItem.answer[0].valueReference.reference
    };
  }

  return location;
} 