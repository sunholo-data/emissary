# Emissary

Emissary is an AI assisted messenger service that can beused to create an Emissary to speak on your behalf.

Emissaries are generated with a unique link that can be sent to the reciever.  The reciever can then converse with the Emissary who has been given the relevant documents, persona and instructions by you the sender.  Recievers can then reply to you or the Emissary.

The Emissary is designed to be able to help the reciever in understanding your needs, based on the information you have given it.  Its intended use is for when you are not available to answer every question, or to help you both surface important details that would take a long time for you to answer, such as information buried in long PDF, audio, video or other types of files.

The Emissaries are not intended as generalists.  Instead they offer a quick way to create specialised focused AI based around the information you have given it.

Tool that the Emissary can use to help faciliate the conversation are:

* Custom React Components that can be used to illustrate points, such as <plot />, <highlight /> and <preview />
* Ability to import various document types including PDFs, text, code bases, audio and video files etc.
* Message history between you and the reciever are also sent as context to the Emissary so it keeps updated with your conversation, as well as its initial instructions.

Under the hood, the Emissary is powered by Gemini 1.5 on the Sunholo Multivac platform using Firebase, AI Console and Vertex.  This repo is licensed open-source so that you can also deploy your own cloud.


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


## Creating initial Emissary Templates

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
