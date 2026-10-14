# Changelog

All notable changes to this portfolio project are documented here.

## [0.1.0] - 2026-07-13

### Added

- Sanitized n8n workflow export for GTM lead sourcing and CRM enrichment.
- Synthetic input and output examples.
- Architecture, setup, and troubleshooting documentation.
- Security-conscious configuration templates and ignore rules.

### Changed

- Replaced private Google Sheet, workflow, credential, and webhook identifiers.
- Removed organization-specific Zoho custom fields from the public export.
- Updated workflow notes to reflect callback, deduplication, validation, and review behavior.

### Known limitations

- Clay must be configured separately to read queued records and POST enriched fields to each n8n resume URL.
- The workflow is manually triggered and processes the first enquiry row.
- A dedicated production error-notification workflow is not included.

