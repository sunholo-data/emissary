import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');
const projectIdArg = args.find(arg => arg.startsWith('--project-id='));
const projectId = projectIdArg 
  ? projectIdArg.split('=')[1]
  : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('Error: Project ID must be specified via --project-id=YOUR_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable');
  process.exit(1);
}

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
  projectId
});

const db = getFirestore();

async function loadTemplates() {
  const yamlPath = join(__dirname, 'templates.yaml');
  const yamlContent = await readFile(yamlPath, 'utf8');
  return yaml.load(yamlContent).templates;
}

async function checkExistingTemplates() {
  const templatesRef = db.collection('botConfigs');
  const snapshot = await templatesRef.where('isTemplate', '==', true).get();
  
  const existingTemplates = new Map();
  snapshot.forEach(doc => {
    const data = doc.data();
    existingTemplates.set(data.name, { id: doc.id, ...data });
  });
  
  return existingTemplates;
}

async function seedBots(force = false) {
  console.log(`Using project ID: ${projectId}`);
  console.log('Loading templates from YAML...');
  const templates = await loadTemplates();
  
  console.log('Checking existing templates...');
  const existingTemplates = await checkExistingTemplates();
  
  if (existingTemplates.size > 0) {
    console.log('Found existing templates:');
    existingTemplates.forEach((template, name) => {
      console.log(`- ${name} (ID: ${template.id})`);
    });
    
    if (!force) {
      console.log('\nTemplates already exist. Use --force to overwrite them.');
      return false;
    }
  }
  
  console.log('\nStarting bot template seeding...');
  
  try {
    const batch = db.batch();
    const updates = [];
    
    for (const [key, template] of Object.entries(templates)) {
      const existing = existingTemplates.get(template.name);
      const botId = existing?.id || crypto.randomUUID();
      const timestamp = Date.now();
      
      const botConfig = {
        ...template,
        isTemplate: true,
        botId,
        updatedAt: timestamp,
        createdAt: existing?.createdAt || timestamp
      };

      console.log(`${existing ? 'Updating' : 'Creating'} template ${key} with ID: ${botId}`);
      const docRef = db.collection('botConfigs').doc(botId);
      batch.set(docRef, botConfig, { merge: true });
      updates.push(key);
    }

    if (updates.length > 0) {
      console.log('Committing batch...');
      await batch.commit();
      console.log('Bot template seeding completed successfully!');
      console.log('Updated templates:', updates.join(', '));
    } else {
      console.log('No updates needed.');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding bot templates:', error);
    throw error;
  }
}

// Run the seeding
seedBots(force)
  .then((completed) => {
    if (completed) {
      console.log('Seeding completed successfully');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });