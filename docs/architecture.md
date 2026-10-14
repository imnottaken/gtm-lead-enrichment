# Architecture

## Components

- **n8n** orchestrates validation, sourcing, normalization, batching, enrichment coordination, CRM matching, and audit writes.
- **Google Sheets** supplies enquiry intent and stores enrichment, review, and qualified-output records.
- **Apify** runs the Google Places crawler used to source business records and contact channels.
- **Clay** performs person-level enrichment outside the workflow and calls the execution-specific n8n resume URL.
- **Zoho CRM** is the CRM source of truth for duplicate matching and accepted leads.

## Data flow

1. A user manually starts the workflow.
2. n8n reads the first enquiry row and normalizes flexible column names.
3. Required query fields are validated before any paid or external request.
4. Apify returns business records. A Code node flattens provider responses, normalizes identity and contact fields, removes duplicates, and scores data quality.
5. Records without both a usable email and phone are not required; at least one usable contact channel is required.
6. Each record is classified as a small or larger organization. The target role becomes owner/founder for small organizations or HR/admin for larger organizations.
7. The record and its execution-specific callback URL are written to the Enrichment sheet. n8n waits for Clay for up to two hours.
8. Callback data is merged with company data. A timeout or no-person result falls back to a company-level lead when a company email or phone exists.
9. Zoho lead candidates are searched and classified as a unique duplicate, ambiguous match, or new lead.
10. CRM field lengths and email/phone formats are validated before routing to update, create, or Review.
11. The Output sheet is updated only after Zoho confirms success.

## Major branches

- **Invalid enquiry:** write a structured issue to Review and finish cleanly.
- **No contactable source result:** write a zero-result issue to Review.
- **Clay contact found:** create or update a person-style Zoho lead linked through the Company field.
- **Clay timeout/no person:** use the company as the lead when a usable contact channel remains.
- **Ambiguous Zoho match:** do not write to CRM; route to Review.
- **Zoho failure:** preserve the record and sanitized error reason in Review.

## Failure paths

Apify and Zoho request nodes retry up to three times with a five-second delay. CRM nodes emit errors to an explicit failure branch. Review records preserve enough identifiers and reasons for manual correction and safe reprocessing.

The public version does not include a dedicated n8n Error Trigger workflow. Production deployments should add one when failure notification becomes operationally necessary.

## Security considerations

- Credentials are stored in n8n, not in workflow JSON or environment files committed to Git.
- The public export contains a placeholder Google Sheet ID and no webhook IDs.
- Clay callback URLs are execution-specific and should not be logged or shared outside the enrichment table.
- Execution-data retention should be reviewed because sourced contact data may contain personal information.
- Google, Apify, Clay, and Zoho access should use least-privilege accounts.

