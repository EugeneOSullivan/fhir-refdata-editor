import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SDCFormWrapper } from '../SDCFormWrapper';
import practitionerQ from '../../questionnaires/practitioner-questionnaire.json';
import type { QuestionnaireResponse } from '@medplum/fhirtypes';

describe('SDCFormWrapper', () => {
  const mockOnSave = jest.fn();
  const mockQuestionnaireResponse: QuestionnaireResponse = {
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

  beforeEach(() => {
    mockOnSave.mockClear();
  });

  it('renders the form with initial data', () => {
    render(
      <SDCFormWrapper
        questionnaire={practitionerQ}
        initialResponse={mockQuestionnaireResponse}
        onSave={mockOnSave}
        isCreating={false}
      />
    );

    expect(screen.getByText('Family name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    render(
      <SDCFormWrapper
        questionnaire={practitionerQ}
        initialResponse={mockQuestionnaireResponse}
        onSave={mockOnSave}
        isCreating={false}
      />
    );

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows validation errors for required fields', async () => {
    const emptyResponse: QuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      status: 'in-progress',
      item: []
    };

    render(
      <SDCFormWrapper
        questionnaire={practitionerQ}
        initialResponse={emptyResponse}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    const saveButton = screen.getByText('Create Practitioner');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
  });

  it('handles form updates', async () => {
    render(
      <SDCFormWrapper
        questionnaire={practitionerQ}
        initialResponse={mockQuestionnaireResponse}
        onSave={mockOnSave}
        isCreating={false}
      />
    );

    const familyNameInput = screen.getByDisplayValue('Smith');
    fireEvent.change(familyNameInput, { target: { value: 'Updated Name' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          item: expect.arrayContaining([
            expect.objectContaining({
              item: expect.arrayContaining([
                expect.objectContaining({
                  answer: [{ valueString: 'Updated Name' }]
                })
              ])
            })
          ])
        })
      );
    });
  });
}); 