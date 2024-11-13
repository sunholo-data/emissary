# Messenger

Its two containers python backend React UI.
https://uimessenger-374404277595.europe-west1.run.app

But...its not in VPC (so no AlloydB?) due to not able to bootstrap via terraform (deleting cloud run bootstrap to deploy at the moment)

TODO: add a terraform bootstrap for multi-container cloud run

## Install

https://ui.shadcn.com/docs/installation/next

```bash
npx create-next-app@latest file-chat --typescript --tailwind --eslint
cd file-chat
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn@latest add select
```

Replace `src/app/page.tsx` with code from `https://v0.dev/chat/mhkDddo3Uwk` but set `"use client";` at top of it

## dev

`npm run dev`

For firebase local development

```
npm install -g firebase-tools
firebase init emulators
```

## Development setup

	•	`dev:` This is the main development script. It starts the Firebase emulators and your Next.js app in parallel. This way, you’ll be using the emulators when running the dev command.
	•	`dev:cloud:` This is an alternative development script that starts only the Next.js dev server without the emulators. This allows you to develop locally but use the Firebase cloud services.
	•	`start:emulators:` This runs the Firebase emulators. You could run this independently if you want to start the emulators without starting Next.js.

Usage

	•	Local Development with Emulators: Run `npm run dev`. This will start the emulators alongside your Next.js app.
	•	Local Development with Cloud Services: Run `npm run dev:cloud`. This will start the Next.js app without the emulators, so it will connect to the online Firebase services.

Emulators work when `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` which the above scripts set.

The app will launch locally at http://127.0.0.1:3000/ and the Firestore emulators are locally at http://127.0.0.1:4000/

## deploy

set to right project

```bash
gcloud config set project multivac-internal-dev
npm run seed
```

Will add teplate bots to Firestore:

```js
const INITIAL_TEMPLATES = {
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
    defaultInstructions: `As Hermes, you are to act as a formal messenger...`,
    isTemplate: true
  }
};
```

Force updates:

```sh
npm run seed:force
```

Need to create firestore index for chat message history eg.
https://console.firebase.google.com/v1/r/project/multivac-internal-dev/firestore/indexes?create_composite=ClZwcm9qZWN0cy9tdWx0aXZhYy1pbnRlcm5hbC1kZXYvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL21lc3NhZ2VzL2luZGV4ZXMvXxABGggKBHJlYWQQARoNCgl1c2VyRW1haWwQARoMCghfX25hbWVfXxAB
