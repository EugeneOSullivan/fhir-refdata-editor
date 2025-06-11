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

# Validation (runs type check, lint, and build)
validate:
	npm run type-check && npm run lint && npm run build

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

# Help
help:
	@echo "Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make dev           - Start development server"
	@echo "  make build         - Build for production"
	@echo "  make lint          - Run linter"
	@echo "  make lint-fix      - Run linter with auto-fix"
	@echo "  make format        - Format code with Prettier"
	@echo "  make type-check    - Run TypeScript type checking"
	@echo "  make validate      - Run all validations (no tests)"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run Docker container" 