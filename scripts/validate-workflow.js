import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workflowPath = path.resolve(__dirname, '../workflows/gtm-lead-sourcing-and-crm-enrichment.json');

console.log('🔍 Validating n8n Workflow JSON...\n');

if (!fs.existsSync(workflowPath)) {
  console.error(`❌ Workflow file not found at: ${workflowPath}`);
  process.exit(1);
}

let workflow;
try {
  const content = fs.readFileSync(workflowPath, 'utf8');
  workflow = JSON.parse(content);
} catch (err) {
  console.error(`❌ Failed to parse JSON: ${err.message}`);
  process.exit(1);
}

if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
  console.error('❌ Workflow does not contain a valid "nodes" array.');
  process.exit(1);
}

if (!workflow.connections || typeof workflow.connections !== 'object') {
  console.error('❌ Workflow does not contain a valid "connections" object.');
  process.exit(1);
}

const nodeNames = new Set(workflow.nodes.map((n) => n.name));
const nodeTypes = {};
const placeholders = new Set();

for (const node of workflow.nodes) {
  nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
  const str = JSON.stringify(node);
  const matches = str.match(/YOUR_[A-Z0-9_]+/g);
  if (matches) {
    for (const m of matches) placeholders.add(m);
  }
}

// Validate connections
let brokenConnections = 0;
for (const [sourceNode, connectionData] of Object.entries(workflow.connections)) {
  if (!nodeNames.has(sourceNode)) {
    console.warn(`⚠️ Connection references missing source node: "${sourceNode}"`);
    brokenConnections++;
  }
  if (connectionData.main) {
    for (const branch of connectionData.main) {
      for (const conn of branch) {
        if (!nodeNames.has(conn.node)) {
          console.warn(`⚠️ Connection references missing target node: "${conn.node}"`);
          brokenConnections++;
        }
      }
    }
  }
}

console.log(`✅ Workflow Name: "${workflow.name}"`);
console.log(`✅ Total Nodes: ${workflow.nodes.length}`);
console.log(`✅ Connected Nodes: ${Object.keys(workflow.connections).length}`);
console.log(`\n📊 Node Breakdown:`);
for (const [type, count] of Object.entries(nodeTypes)) {
  console.log(`   - ${type}: ${count}`);
}

if (brokenConnections === 0) {
  console.log('\n✅ All node connections are valid and point to existing nodes.');
} else {
  console.error(`\n❌ Found ${brokenConnections} broken connection(s)!`);
  process.exit(1);
}

if (placeholders.size > 0) {
  console.log('\nℹ️  Detected setup placeholders to configure before production:');
  for (const p of placeholders) {
    console.log(`   • ${p}`);
  }
}

console.log('\n🎉 Workflow validation passed successfully!\n');
