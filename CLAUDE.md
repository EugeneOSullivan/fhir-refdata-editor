# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
npm run dev          # Start development server (Vite) on http://localhost:5173
```

### Build & Quality Checks
```bash
npm run build        # TypeScript compilation + production build
npm run type-check   # TypeScript type checking only
npm run lint         # ESLint linting
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier formatting
npm run validate     # Run type-check, lint, and build in parallel
```

### Testing
```bash
npm test             # Run tests (Vitest)
npm run preview      # Preview production build locally
```

## Architecture Overview

This is a React-based FHIR reference data editor that uses Structured Data Capture (SDC) forms for standardized data entry. The application manages four core FHIR resource types: Practitioners, Organizations, Locations, and Practitioner Roles.

### Key Architectural Patterns

**Hybrid Form Rendering**: The app uses two rendering approaches:
- SDC questionnaire forms (via @aehrc/smart-forms-renderer) for standard fields
- Custom picker components for FHIR reference fields that need type-ahead search

**FHIR-SDC Mapping**: Bidirectional mapping utilities convert between:
- Native FHIR resources (for API storage)
- SDC QuestionnaireResponse format (for form rendering)

**Proxy-based FHIR Client**: Uses Vite dev server proxy to route `/fhir/*` requests to the FHIR server (configured in vite.config.ts), avoiding CORS issues.

### Core Components

**SDCFormWrapper** (`src/components/SDCFormWrapper.tsx`):
- Main form container that detects reference fields
- Orchestrates between custom pickers and SDC renderer
- Manages form state via useQuestionnaireResponseStore

**Resource Lists** (`src/components/*List.tsx`):
- Search and pagination for each resource type
- Debounced search with FHIR Bundle navigation
- Loading states and skeleton animations

**Custom Pickers** (`src/components/*Picker.tsx`):
- Type-ahead search components for FHIR references
- Used for Practitioner and Organization references in forms
- Integrated into SDC forms via CustomPickerRenderer

**Mapping Utilities** (`src/utils/*Mapping.ts`):
- Convert FHIR resources ↔ SDC QuestionnaireResponse format
- Handle complex nested structures (names, telecoms, addresses)
- Support both creation and editing workflows

### FHIR Integration

**Client Structure** (`src/fhirClient.ts`):
- Uses fetch-based client with proxy routing
- Supports GET, POST, PUT, DELETE operations
- Handles FHIR Bundle pagination via link relations

**Resource Management**:
- Practitioners & Organizations: Use SDC questionnaire workflow
- PractitionerRoles & Locations: Use direct FHIR resource forms
- All resources support search, create, edit, delete operations

**Data Flow**:
1. Load resource → Convert to SDC format → Render form
2. Form changes → Update SDC response → Save as FHIR resource
3. Reference fields → Custom picker → Search related resources

### Form System Details

**Questionnaire Structure**: JSON questionnaires in `src/questionnaires/` define form structure and validation rules.

**Reference Field Handling**: The SDCFormWrapper detects reference-type fields and renders custom picker components instead of basic text inputs.

**State Management**: Uses @aehrc/smart-forms-renderer's built-in store with custom polling to detect changes and trigger saves.

### Development Notes

**FHIR Server Configuration**: The default proxy targets `hapi.fhir.org/baseR4`. Update `vite.config.ts` to point to your FHIR server.

**Testing**: Existing test files in `src/utils/*.test.ts` and `src/components/__tests__/*.test.tsx` use Vitest and React Testing Library.

**Styling**: Uses CSS custom properties for theming in `src/styles/components.css` with both light and dark mode support.