# FHIR Reference Data Editor

A React-based application for managing FHIR reference data resources using Structured Data Capture (SDC) forms. This application provides a user-friendly interface for creating, viewing, editing, and searching various FHIR resources in a standardized format.

## What It Does

The FHIR Reference Data Editor is a comprehensive tool for healthcare administrators and developers to manage core reference data in a FHIR-compatible system. It provides:

- **Resource Management**: Create, edit, view, and delete FHIR resources
- **Search & Discovery**: Find existing resources with real-time search and pagination
- **Standardized Forms**: Use SDC (Structured Data Capture) forms for consistent data entry
- **Type-ahead Lookups**: Intelligent picker components for referencing related resources
- **Modern UI**: Clean, responsive interface with loading animations and smooth interactions

## Features

### Supported Resource Types
- **Practitioners**: Healthcare professionals with contact information and qualifications
- **Organizations**: Healthcare facilities, clinics, and administrative entities
- **Locations**: Physical locations where healthcare services are provided
- **Practitioner Roles**: Relationships between practitioners and organizations

### Core Functionality
- **Search & Browse**: Real-time search with debounced input and pagination
- **Create & Edit**: Intuitive forms with validation and auto-save capabilities
- **Reference Management**: Smart picker components for linking related resources
- **Data Validation**: FHIR-compliant validation with real-time feedback
- **Performance Optimized**: Efficient loading, caching, and state management
- **Responsive Design**: Works on desktop and mobile devices

### User Experience
- **Loading Animations**: Skeleton loaders and smooth transitions
- **Error Handling**: Clear error messages and recovery options
- **Auto-completion**: Type-ahead suggestions for better data entry
- **Breadcrumb Navigation**: Clear navigation between different resource types
- **Theme Support**: Light/dark mode toggle

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **FHIR Integration**: Custom FHIR client with @medplum/fhirtypes
- **Form Rendering**: @aehrc/smart-forms-renderer for SDC forms
- **Styling**: Tailwind CSS with custom components
- **Build Tool**: Vite for fast development and optimized builds
- **Development**: ESLint, TypeScript, React Fast Refresh

## Project Structure

```
src/
├── components/
│   ├── SDCFormWrapper.tsx        # Main form wrapper with SDC integration
│   ├── PractitionerList.tsx      # Practitioner search and list
│   ├── OrganizationList.tsx      # Organization search and list
│   ├── LocationList.tsx          # Location search and list
│   ├── PractitionerRoleList.tsx  # Practitioner role search and list
│   ├── PractitionerPicker.tsx    # Type-ahead picker for practitioners
│   ├── OrganizationPicker.tsx    # Type-ahead picker for organizations
│   ├── Breadcrumb.tsx            # Navigation breadcrumbs
│   ├── ThemeToggle.tsx           # Light/dark mode toggle
│   └── ResponseDisplay.tsx       # Modal for displaying responses
├── questionnaires/
│   ├── practitioner-questionnaire.json      # SDC form for practitioners
│   ├── organization-questionnaire.json      # SDC form for organizations
│   ├── location-questionnaire.json          # SDC form for locations
│   └── practitioner-role-questionnaire.json # SDC form for practitioner roles
├── utils/
│   ├── practitionerMapping.ts    # FHIR ↔ SDC mapping for practitioners
│   ├── organizationMapping.ts    # FHIR ↔ SDC mapping for organizations
│   ├── locationMapping.ts        # FHIR ↔ SDC mapping for locations
│   ├── practitionerRoleMapping.ts # FHIR ↔ SDC mapping for practitioner roles
│   └── ThemeContext.tsx          # Theme management
├── fhirClient.ts                 # FHIR API client configuration
└── App.tsx                       # Main application component
```

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Access to a FHIR R4 server

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fhir-refdata-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure FHIR server**
   
   Update `src/fhirClient.ts` with your FHIR server details:
   ```typescript
   export const fhirClient = {
     baseUrl: 'https://your-fhir-server/fhir',
     headers: {
       'Authorization': 'Bearer your-token',
       'Content-Type': 'application/fhir+json'
     }
   };
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Environment Configuration

Create a `.env` file in the root directory:
```env
VITE_FHIR_SERVER_URL=https://your-fhir-server/fhir
VITE_FHIR_AUTH_TOKEN=your-auth-token
```

### CORS Configuration

Ensure your FHIR server allows requests from the development server:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

## How It Works

### Architecture Overview

The application uses a hybrid approach combining SDC forms with custom picker components:

1. **SDC Forms**: Standardized forms defined in JSON questionnaires
2. **Custom Pickers**: Type-ahead components for reference fields
3. **Mapping Utilities**: Convert between FHIR resources and SDC format
4. **FHIR Client**: Handles all API interactions

### Data Flow

1. **Resource Loading**
   - User searches or browses resources
   - FHIR client fetches data with pagination
   - Results displayed in responsive tables
   - Loading states and animations provide feedback

2. **Form Interaction**
   - SDC forms render with Material-UI styling
   - Reference fields use custom picker components
   - Real-time validation and auto-save
   - Data converted between FHIR and SDC formats

3. **Data Persistence**
   - Form data validated and converted to FHIR format
   - POST/PUT requests sent to FHIR server
   - Success/error feedback provided to user
   - UI updated with saved data

### Key Components

#### SDCFormWrapper
- Wraps the smart forms renderer
- Detects reference fields and renders custom pickers
- Manages form state and validation
- Handles data conversion between formats

#### List Components
- Implement search with debouncing
- Handle pagination using FHIR bundle links
- Display loading states and animations
- Provide selection interface

#### Picker Components
- Type-ahead search for related resources
- Display resource names and IDs
- Handle selection and validation
- Support prepopulation for editing

#### Mapping Utilities
- Convert FHIR resources to SDC format
- Handle reference field mapping
- Maintain data integrity
- Support bidirectional conversion

## FHIR Integration

### Supported Operations
- `GET /{resourceType}` - Search resources with filters
- `GET /{resourceType}/{id}` - Get specific resource
- `POST /{resourceType}` - Create new resource
- `PUT /{resourceType}/{id}` - Update existing resource

### Resource Types
- **Practitioner**: Healthcare professionals
- **Organization**: Healthcare facilities and entities
- **Location**: Physical service locations
- **PractitionerRole**: Practitioner-organization relationships

### Data Mapping
Each resource type has dedicated mapping utilities that:
- Convert FHIR resources to SDC questionnaire responses
- Handle reference field relationships
- Maintain data consistency
- Support validation rules

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
```

### Building for Production
```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

### Testing
```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make your changes following the existing patterns
4. Add tests for new functionality
5. Commit with clear messages (`git commit -m 'Add new feature'`)
6. Push and create a pull request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include loading states
- Test thoroughly before submitting
- Update documentation as needed

## License

This project is licensed under the MIT License.

## Acknowledgments

- [@aehrc/smart-forms-renderer](https://github.com/aehrc/smart-forms-renderer) for SDC form rendering
- [@medplum/fhirtypes](https://github.com/medplum/medplum) for FHIR type definitions
- [Vite](https://vitejs.dev/) for build tooling
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
