describe('Practitioner Management', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should search for practitioners', () => {
    // Search for a practitioner
    cy.get('input[placeholder*="Search"]').type('Smith');
    cy.get('div[style*="cursor: pointer"]').should('exist');
  });

  it('should create a new practitioner', () => {
    // Click create new button
    cy.contains('Create New Practitioner').click();

    // Fill in the form
    cy.get('input[name*="family"]').type('Doe');
    cy.get('input[name*="given"]').type('John');
    
    // Add identifier
    cy.contains('Add Identifier').click();
    cy.get('input[name*="system"]').type('http://example.com/identifiers');
    cy.get('input[name*="value"]').type('12345');

    // Save the practitioner
    cy.contains('Save').click();

    // Verify success
    cy.contains('Success').should('exist');
  });

  it('should edit an existing practitioner', () => {
    // Search and select a practitioner
    cy.get('input[placeholder*="Search"]').type('Smith');
    cy.get('div[style*="cursor: pointer"]').first().click();

    // Edit the form
    cy.get('input[name*="family"]').clear().type('Updated Name');
    
    // Save changes
    cy.contains('Save').click();

    // Verify success
    cy.contains('Success').should('exist');
  });

  it('should handle validation errors', () => {
    // Click create new button
    cy.contains('Create New Practitioner').click();

    // Try to save without required fields
    cy.contains('Save').click();

    // Verify validation errors
    cy.contains('Required').should('exist');
  });
}); 