# Setup

## Prerequisites

- An n8n instance compatible with the node versions in the workflow export.
- Google Sheets, Apify, Clay, and Zoho CRM accounts.
- Permission to create credentials and import workflows in n8n.

## 1. Clone and import

```bash
git clone https://github.com/imnottaken/gtm-lead-enrichment.git
cd gtm-lead-enrichment
```

In n8n, choose **Import from File** and select `workflows/gtm-lead-sourcing-and-crm-enrichment.json`.

## 2. Create n8n credentials

Create and test these credentials in n8n:

1. Google Sheets OAuth2 credential with access to the lead workbook.
2. HTTP Bearer Auth credential containing the Apify API token.
3. Zoho OAuth2 credential with permission to read, create, and update Leads.

Attach the credentials to every matching node after import. No credentials are included in this repository.

## 3. Prepare the Google workbook

Create these sheets:

- `Sheet1` for enquiry input.
- `Enrichment` for Clay-bound records and callback metadata.
- `Output` for records confirmed by Zoho.
- `Review` for invalid, ambiguous, timed-out-without-contact, and failed records.

Use the field names shown in `examples/sample-input.json` for the enquiry sheet. Importing the workflow exposes the full mapped schemas for the three output sheets.

Replace every `YOUR_GOOGLE_SHEET_ID` resource locator with the real workbook ID and reselect each sheet from n8n's resource picker.

## 4. Configure Apify

Attach the HTTP Bearer Auth credential to **Search Business Directory API**. The default actor is `compass/crawler-google-places`; it can be overridden by the `apify_actor_id` enquiry field.

Review actor input compatibility before running because Apify actor schemas can change independently of this workflow.

## 5. Configure Clay callback enrichment

Configure a Clay table or automation to:

1. Read new rows from the `Enrichment` sheet or receive the same record through a Clay webhook.
2. Use `enrichmentRoleTarget` to search for an owner/founder or HR/admin contact.
3. POST the enrichment result to the row's `clayCallbackUrl`.
4. Include `uniqueKey` plus any available `contactFullName`, `contactFirstName`, `contactLastName`, `contactTitle`, `contactEmail`, `contactPhone`, `contactSource`, and `enrichmentStatus` fields.

The current n8n export writes to the Enrichment sheet; it does not POST directly to the optional `CLAY_TABLE_WEBHOOK_URL`. This integration boundary is intentional and must be completed in Clay before testing the person-enrichment path.

## 6. Configure Zoho

Attach the Zoho credential to all Zoho nodes. Confirm that standard fields such as Industry, Lead Source, and Lead Status accept the supplied values in your Zoho layout.

The rep name is stored only in Description notes. The public workflow does not require a rep-name custom field and does not assign the Zoho Owner.

## 7. Run a controlled test

1. Add one synthetic enquiry row based on `examples/sample-input.json`.
2. Disable Clay auto-run or use a zero-credit test configuration until the callback mapping is verified.
3. Run the workflow manually.
4. Confirm the Enrichment row contains a callback URL.
5. POST a synthetic Clay callback with the same `uniqueKey`.
6. Verify duplicate routing in Zoho using a test lead or sandbox.
7. Confirm Output is written only after Zoho success and Review captures failures.

## 8. Activate safely

This version uses a Manual Trigger, so publishing it does not create a schedule. Review execution retention, credential scopes, API quotas, and the roadmap before adapting it for production use.

## 9. Local self-hosted n8n (Docker)

To run n8n locally using the included `docker-compose.yml`:

```bash
# Start local n8n instance on http://localhost:5678
npm run n8n:up

# Check logs
npm run n8n:logs

# Stop instance
npm run n8n:down
```

Data is persisted locally in `./n8n_data`.

## 10. Automated Validation & Simulation

Run offline schema and workflow logic tests without consuming external API credits:

```bash
# Validate workflow JSON structure, integrity, and node connections
npm run validate

# Run simulation test of contactability filtering, quality scoring, and data contract
npm run simulate

# Run both checks
npm run test
```

## 11. Model Context Protocol (n8n-mcp) Setup

`n8n-mcp` connects AI assistants (Antigravity, Cursor, Claude Desktop) directly to n8n's node catalog (3,100+ nodes) and local instance APIs:

### Antigravity / Gemini CLI
Configured in `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "http://localhost:5678"
      }
    }
  }
}
```

### Cursor / Claude Desktop
Add to your client configuration (or use the workspace `mcp_config.json`):
```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "YOUR_N8N_API_KEY"
      }
    }
  }
}
```

