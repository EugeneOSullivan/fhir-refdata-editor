import type { Meta, StoryObj } from '@storybook/react';
import { SDCFormWrapper } from './SDCFormWrapper';
import practitionerQ from '../questionnaires/practitioner-questionnaire.json';

const meta: Meta<typeof SDCFormWrapper> = {
  title: 'Components/SDCFormWrapper',
  component: SDCFormWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SDCFormWrapper>;

const mockQuestionnaireResponse = {
  resourceType: 'QuestionnaireResponse' as const,
  status: 'in-progress' as const,
  item: [
    {
      linkId: 'name',
      text: 'Name',
      item: [
        {
          linkId: 'name.family',
          text: 'Family name',
          answer: [{ valueString: 'Smith' }]
        },
        {
          linkId: 'name.given',
          text: 'Given name',
          answer: [{ valueString: 'John' }]
        }
      ]
    }
  ]
};

export const Default: Story = {
  args: {
    questionnaire: practitionerQ,
    initialResponse: mockQuestionnaireResponse,
    onSave: async (response) => {
      console.log('Save clicked with response:', response);
      return response;
    },
    isCreating: false,
  },
};

export const CreatingNew: Story = {
  args: {
    questionnaire: practitionerQ,
    initialResponse: {
      resourceType: 'QuestionnaireResponse',
      status: 'in-progress',
      item: []
    },
    onSave: async (response) => {
      console.log('Save clicked with response:', response);
      return response;
    },
    isCreating: true,
  },
};

export const WithValidation: Story = {
  args: {
    questionnaire: practitionerQ,
    initialResponse: {
      resourceType: 'QuestionnaireResponse',
      status: 'in-progress',
      item: [
        {
          linkId: 'name',
          text: 'Name',
          item: [
            {
              linkId: 'name.family',
              text: 'Family name',
              answer: [{ valueString: '' }]
            }
          ]
        }
      ]
    },
    onSave: async (response) => {
      console.log('Save clicked with response:', response);
      return response;
    },
    isCreating: false,
  },
}; 