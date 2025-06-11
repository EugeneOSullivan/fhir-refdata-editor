.PHONY: install dev build test lint format clean docker-build docker-run

# Install dependencies
install:
	npm install

# Development
dev:
	npm run dev

# Build
build:
	npm run build

# Testing
test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

# Linting and Formatting
lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

# Type checking
type-check:
	npm run type-check

# Validation (runs type check, lint, test, and build)
validate:
	npm run validate

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf coverage
	rm -rf node_modules
	rm -rf .storybook-static

# Docker commands
docker-build:
	docker build -t fhir-sdc-app .

docker-run:
	docker run -p 5173:5173 fhir-sdc-app

# Storybook
storybook:
	npm run storybook

build-storybook:
	npm run build-storybook

# Cypress
cypress-open:
	npm run cypress:open

cypress-run:
	npm run cypress:run

# Help
help:
	@echo "Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make dev           - Start development server"
	@echo "  make build         - Build for production"
	@echo "  make test          - Run tests"
	@echo "  make test-watch    - Run tests in watch mode"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make lint          - Run linter"
	@echo "  make lint-fix      - Run linter with auto-fix"
	@echo "  make format        - Format code with Prettier"
	@echo "  make type-check    - Run TypeScript type checking"
	@echo "  make validate      - Run all validations"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run Docker container"
	@echo "  make storybook     - Start Storybook"
	@echo "  make cypress-open  - Open Cypress"
	@echo "  make cypress-run   - Run Cypress tests" 