# Troubleshooting

## Missing credentials

After import, n8n may show credential warnings. Create credentials in n8n and attach them to all Google Sheets, Apify HTTP Request, and Zoho CRM nodes. Credential IDs are intentionally absent from the public export.

## Google Sheet resource errors

Replace `YOUR_GOOGLE_SHEET_ID`, then use the resource picker to reselect each sheet. Confirm the credential has edit access and the expected headers exist.

## Invalid Apify response or zero results

Confirm the actor ID and token, review the actor's current input schema, and inspect the Review row. A successful API call can still produce no contactable records when every result lacks both email and a usable phone.

## Workflow waits indefinitely

The Clay step pauses for a maximum of two hours. Confirm Clay received `clayCallbackUrl`, sends an HTTP POST, includes the same `uniqueKey`, and does not reuse an expired callback URL.

## Clay callback is rejected or ignored

Check that the callback body is JSON and that `uniqueKey` matches the queued record. Never use a callback URL from another execution.

## Ambiguous Zoho duplicate

When multiple candidates match, the workflow routes the record to Review. Resolve the correct CRM record manually and reprocess only after confirming that a duplicate create cannot occur.

## Zoho validation error

Check field permissions, layout requirements, picklist values, and OAuth scopes. The workflow validates common lengths and contact formats, but Zoho can enforce organization-specific rules that are not portable.

## Rate limits and timeouts

Apify and Zoho calls retry three times with a five-second delay. If limits persist, reduce the requested lead count, increase throttling, and verify provider quotas before re-executing.

## n8n version compatibility

Import the workflow into a current n8n release. If a node version is unavailable, upgrade n8n or open and resave the affected node after reviewing its migration notes; do not silently downgrade Code, Wait, Loop, or CRM nodes.

## Malformed input

Location and business type are required. Flexible header aliases are normalized, but empty values are routed to Review rather than sent to Apify.

