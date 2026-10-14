import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Simulating GTM Lead Enrichment Workflow Logic...\n');

const inputPath = path.resolve(__dirname, '../examples/sample-input.json');
const enquiry = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log('📥 Input Enquiry:');
console.log(`   Location: ${enquiry.location}`);
console.log(`   Business Type: ${enquiry['business type']}`);
console.log(`   Keywords: ${enquiry.keywords}`);
console.log(`   Target Leads: ${enquiry['number of leads required']}\n`);

// Synthetic raw records as would be returned by Apify Google Places actor
const mockRawPlaces = [
  {
    title: 'Example Industrial Services',
    website: 'https://example-industrial.test',
    email: 'sales@example-industrial.test',
    phone: '+15550102020',
    address: '100 Main St, Austin, TX 78701',
    categoryName: 'Industrial Equipment Supplier',
    categories: ['Equipment Supplier', 'Distributor'],
    reviewsCount: 120
  },
  {
    title: 'Ghost Logistics Corp',
    website: 'https://ghostlogistics.test',
    // No email, no phone -> should be rejected by contactability filter
    address: 'Austin, TX',
    categoryName: 'Logistics',
    reviewsCount: 15
  }
];

// Helper functions mirroring workflow code nodes
function cleanWebsite(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  const withProtocol = /^https?:\/\//i.test(input) ? input : 'https://' + input;
  try {
    return new URL(withProtocol).origin.replace(/\/$/, '');
  } catch {
    return input;
  }
}

function domainFromWebsite(value) {
  try {
    return new URL(cleanWebsite(value)).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function cleanPhone(value) {
  return String(value || '').replace(/[^+0-9]/g, '').trim();
}

function phoneDigits(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

// 1. Extraction, Normalization & Scoring
const processedLeads = [];
for (const raw of mockRawPlaces) {
  const companyName = raw.title?.trim();
  const website = cleanWebsite(raw.website);
  const email = (raw.email || '').toLowerCase().trim();
  const phone = cleanPhone(raw.phone);
  const location = raw.address || enquiry.location;

  const hasContact = Boolean(email || phoneDigits(phone).length >= 7);
  if (!hasContact) {
    console.log(`⚠️ Discarding record "${companyName}": Missing both valid email and usable phone.`);
    continue;
  }

  const domain = domainFromWebsite(website);
  const uniqueKey = domain || email || phoneDigits(phone) || companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Scoring
  let score = 0;
  if (companyName) score += 25;
  if (website && domain) score += 20;
  if (email) score += 25;
  if (phoneDigits(phone).length >= 7) score += 10;
  if (location) score += 10;
  if (enquiry['business type']) score += 5;
  if (enquiry.keywords) score += 5;
  score = Math.min(score, 100);

  // 2. Classify Enrichment Target
  const searchableText = `${companyName} ${enquiry['business type']} ${enquiry.keywords} ${raw.categoryName}`.toLowerCase();
  let orgScore = 0;
  if (domain) orgScore += 15;
  if (/\b(corporation|ltd|distributor|technologies|solutions)\b/.test(searchableText)) orgScore += 20;
  if (raw.reviewsCount >= 100) orgScore += 10;

  const orgSizeSegment = orgScore >= 50 ? 'big_org' : 'small';
  const enrichmentRoleTarget = orgSizeSegment === 'big_org' ? 'hr_admin' : 'owner founder managing director';

  // 3. Mock Clay Enrichment Result
  const clayResult = {
    contactFullName: 'Jordan Example',
    contactTitle: 'Owner',
    contactEmail: 'jordan@example-industrial.test',
    enrichmentStatus: 'contact_found'
  };

  // 4. Final Output Payload
  processedLeads.push({
    uniqueKey,
    companyName,
    website,
    email,
    phone,
    location: enquiry.location,
    businessType: enquiry['business type'],
    dataQualityScore: score,
    confidenceBand: score >= 85 ? 'high' : score >= 70 ? 'medium' : 'low',
    orgSizeSegment,
    enrichmentRoleTarget,
    ...clayResult,
    duplicateFound: false,
    crmStatus: 'created',
    crmReady: true,
    reviewReason: 'Zoho lead created successfully'
  });
}

console.log(`\n✅ Successfully processed ${processedLeads.length} contactable lead(s):\n`);
console.dir(processedLeads[0], { depth: null, colors: true });

if (processedLeads.length > 0 && processedLeads[0].uniqueKey === 'example-industrial.test') {
  console.log('\n🎉 Simulation test verified against sample data contract!\n');
} else {
  console.error('\n❌ Simulation test output did not match expected structure.');
  process.exit(1);
}
