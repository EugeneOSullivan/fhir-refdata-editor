# FHIR SDC Form Editor

A React-based application for editing FHIR Practitioner resources using Structured Data Capture (SDC) forms. This application provides a user-friendly interface for creating, viewing, and editing practitioner information in a FHIR-compatible format.

## Features

- Search and list practitioners with pagination
- Create new practitioners
- Edit existing practitioners using SDC forms
- Real-time form validation
- FHIR-compatible data storage
- Responsive design
- Debounced search and form updates for better performance
- State management optimized to prevent unnecessary re-renders

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **FHIR Integration**: 
  - `@medplum/fhirtypes` for FHIR type definitions
  - Custom FHIR client for API interactions
- **Form Rendering**: `@aehrc/smart-forms-renderer` for SDC form rendering
- **State Management**: React's built-in state management with hooks
- **Styling**: Inline styles with modern CSS features
- **Build Tools**: Vite for development and building
- **Development Tools**:
  - ESLint for code linting
  - TypeScript for type safety
  - React Fast Refresh for development

## Project Structure

```
src/
├── components/
│   ├── SDCFormWrapper.tsx    # Form wrapper component with state management
│   ├── PractitionerList.tsx  # Practitioner search and list component
│   └── ResponseDisplay.tsx   # Modal for displaying response data
├── questionnaires/
│   └── practitioner-questionnaire.json  # SDC form definition
├── utils/
│   └── practitionerMapping.ts # FHIR resource mapping utilities
├── App.tsx                   # Main application component
├── fhirClient.ts            # FHIR API client configuration
└── main.tsx                 # Application entry point
```

## Architecture

### Component Architecture

1. **App Component (`App.tsx`)**
   - Main application container
   - Manages global state and routing
   - Handles practitioner CRUD operations
   - Coordinates between list and form views
   - Implements error handling and loading states

2. **SDCFormWrapper (`SDCFormWrapper.tsx`)**
   - Wraps the smart forms renderer
   - Manages form state and validation
   - Handles form submission and updates
   - Implements debounced updates to prevent unnecessary re-renders
   - Maintains local state for better performance
   - Syncs with global store when necessary

3. **PractitionerList (`PractitionerList.tsx`)**
   - Implements practitioner search functionality
   - Handles pagination with FHIR bundle links
   - Provides practitioner selection interface
   - Implements debounced search (300ms)
   - Supports search by identifier and family name
   - Displays loading and error states

### Data Flow

1. **Practitioner Loading**
   - Search initiated through PractitionerList
   - Results fetched from FHIR server using bundle pagination
   - Selected practitioner loaded into form
   - Data converted between FHIR and questionnaire formats
   - State cleanup to prevent stale data

2. **Form Updates**
   - Local state management prevents unnecessary re-renders
   - Changes debounced to optimize performance
   - Updates synced with global store
   - Validation performed before submission
   - Optimistic updates for better UX

3. **Data Persistence**
   - Form data converted to FHIR format
   - POST/PUT requests to FHIR server
   - Response converted back to questionnaire format
   - UI updated with saved data
   - Error handling with user feedback

## Building and Running

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to a FHIR server (FHIR R4)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/fhir-sdc-app.git
   cd fhir-sdc-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure FHIR server:
   - Update `src/fhirClient.ts` with your FHIR server details:
     ```typescript
     export const fhirClient = {
       baseUrl: 'https://your-fhir-server/fhir',
       // Add any required headers for authentication
       headers: {
         'Authorization': 'Bearer your-token',
         'Content-Type': 'application/fhir+json'
       }
     };
     ```
   - Ensure CORS is properly configured on your FHIR server:
     ```
     Access-Control-Allow-Origin: http://localhost:5173
     Access-Control-Allow-Methods: GET, POST, PUT, DELETE
     Access-Control-Allow-Headers: Content-Type, Authorization
     ```

### Development

Run the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Create a production build:
```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

### Environment Variables

Create a `.env` file in the root directory:
```env
VITE_FHIR_SERVER_URL=https://your-fhir-server/fhir
VITE_FHIR_AUTH_TOKEN=your-auth-token
```

## FHIR Integration

### Resource Types

The application currently supports:
- Practitioner resources (R4)
- Questionnaire resources (SDC forms)
- QuestionnaireResponse resources

### Data Mapping

The application includes utilities for mapping between:
- FHIR Practitioner resources
- SDC QuestionnaireResponse resources
- Form UI state

Key mapping functions:
- `practitionerToQuestionnaireResponse`: Converts FHIR Practitioner to QuestionnaireResponse
- `questionnaireResponseToPractitioner`: Converts QuestionnaireResponse to FHIR Practitioner

### FHIR Operations

The application implements the following FHIR operations:
- `GET /Practitioner` - Search practitioners
- `GET /Practitioner/{id}` - Get practitioner by ID
- `POST /Practitioner` - Create new practitioner
- `PUT /Practitioner/{id}` - Update existing practitioner

## Form Structure

The SDC form is defined in `practitioner-questionnaire.json` and includes:
- Name information (use, family, given, prefix, suffix)
- Identifiers (system and value)
- Contact information (telecom)
- Gender
- Birth date
- Active status

### Form Validation

The form implements:
- Required field validation
- Data type validation
- FHIR resource validation
- Real-time validation feedback

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add appropriate comments and documentation
- Write meaningful commit messages
- Test changes thoroughly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [@aehrc/smart-forms-renderer](https://github.com/aehrc/smart-forms-renderer) for the SDC form rendering
- [@medplum/fhirtypes](https://github.com/medplum/medplum) for FHIR type definitions
- [Vite](https://vitejs.dev/) for the build tooling
- [React](https://reactjs.org/) for the UI framework
