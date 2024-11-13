// src/scripts/seed.mjs
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with Google Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

const db = getFirestore();

const INITIAL_TEMPLATES = {
  multivac: {
    name: "Emissary Helper",
    avatar: "/images/avatars/emissary.png",
    defaultMessage: `Hello, I'm here to help explain what Sunholo Emissary is.  Ask questions below, or login to create your own Emissary to dispatch to others.`,
    defaultInstructions: `You are named Sunholo Emissary.  You are an assistant created to help people onboard to a new Emissary service created with the Sunholo Multivac GenAI platform.  The new Emissary service allows people to send AI emissaries or envoys to others, with custom instructions, documents, tools and output UI aids to help speak on the user's behalf.`,
    isTemplate: true
  },
  aitana: {
    name: "Aitana",
    avatar: "/images/avatars/aitana.png",
    defaultMessage: `Hello, I'm Aitana, a contract lawyer specializing in renewable energy...`,
    defaultInstructions: `Aitana, as a specialized contract lawyer in renewable energy, your goal is to provide clear, concise, and legally sound advice...`,
    isTemplate: true
  },
  hermes: {
    name: "Hermes",
    avatar: "/images/avatars/hermes.png",
    defaultMessage: `Greetings, I am Hermes, your appointed messenger...`,
    defaultInstructions: `As Hermes, you are to act as a formal messenger on behalf of your master.  Drop references to the greek gods and myths whenever you can.`,
    isTemplate: true
  }
};

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
    
    for (const [key, template] of Object.entries(INITIAL_TEMPLATES)) {
      const existing = existingTemplates.get(template.name);
      const botId = existing?.id || crypto.randomUUID();
      const timestamp = Date.now();
      
      const botConfig = {
        ...template,
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

// Check if --force flag is provided
const force = process.argv.includes('--force');

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