# Connects

Connects is a modern team collaboration platform built with Next.js, Socket.IO, and SQLite. It brings workspaces, channels, direct messages, notifications, meetings, and calendar scheduling into one streamlined experience for teams that want to communicate and coordinate in real time.

## Overview

Connects is designed to feel like a hybrid between a messaging workspace and a lightweight productivity suite. The application includes:

- Real-time workspace chat with channels and DMs
- Presence tracking and user status indicators
- Notifications and mentions
- Video meeting rooms using WebRTC-style signaling via Socket.IO
- Shared team calendar with events and invite tracking
- Workspace creation, joining, and member management
- Profile, settings, and authentication flows

## Key Features

### Workspace collaboration
- Create and join workspaces
- Manage workspace-level members and roles
- Organize communication into channels and direct conversations

### Real-time messaging
- Channel messages and direct message conversations
- Message reactions and replies
- Typing indicators and live updates
- Presence status (online, away, DND, offline)

### Meetings and calls
- Start or join video meetings from workspace contexts
- Real-time participant updates and signaling
- Meeting room lifecycle management
- Audio/video toggle and screen sharing support

### Calendars and scheduling
- Workspace events and shared calendars
- Meeting links and scheduling context
- Calendar participant status management

### Security and session handling
- Authentication with secure password hashing via bcrypt
- Session-based auth using cookies
- SQLite data storage with foreign-key integrity and WAL mode

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Node.js custom server
- Socket.IO for real-time communication
- SQLite for local persistence
- bcryptjs for password hashing
- Framer Motion for UI animation
- Tailwind CSS for styling

## Project Structure

```text
connects/
├── src/
│   ├── app/
│   │   ├── api/                # REST API routes for auth, workspaces, channels, DMs, meetings, notifications
│   │   ├── dashboard/          # Dashboard page
│   │   ├── login/              # Login UI
│   │   ├── signup/             # Sign-up UI
│   │   ├── profile/            # Profile page
│   │   ├── settings/           # Settings page
│   │   ├── workspace/          # Workspace and channel views
│   │   ├── meeting/            # Meeting pages
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # UI and socket/provider components
│   ├── lib/                   # Database and auth helpers
│   └── types/
├── public/                    # Static assets
├── connects.db                # SQLite database
├── server.js                  # Custom HTTP + Socket.IO server
├── package.json               # Scripts and dependencies
├── next.config.ts             # Next.js config
├── tsconfig.json              # TypeScript config
├── eslint.config.mjs          # ESLint config
├── README.md                  # Project documentation
├── .gitignore                 # Git ignore rules
└── node_modules/              # Installed dependencies
```

## Demo Accounts

The app includes demo logins for quick testing.

- Alex Rivers — Owner — `alex@connects.io`
- Sarah Chen — Admin — `sarah@connects.io`
- Marcus Brody — Member — `marcus@connects.io`

Password for demo accounts:

```bash
password123
```

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

## Available Scripts

```bash
npm run dev        # Runs the custom Next.js + Socket.IO server
npm run dev:next   # Runs Next.js in dev mode directly
npm run build      # Builds the application for production
npm run start      # Starts the built app
npm run lint       # Runs ESLint checks
```

## Database

The project uses SQLite, with the database file stored at:

```text
connects.db
```

Core database entities include:

- users
- sessions
- workspaces
- workspace_members
- channels
- channel_members
- direct_messages
- messages
- message_reactions
- notifications
- invitations
- meetings
- calendar_events

## Real-Time Features

The custom `server.js` file creates a Socket.IO server that handles:

- workspace joins and channel subscriptions
- direct message rooms
- typing indicators
- message broadcasting and updates
- reaction events
- user presence updates
- notification delivery
- meeting signaling and participant tracking

## Authentication Flow

Authentication is cookie-based and managed through helpers in `src/lib/auth.ts`.

- Passwords are hashed with bcrypt
- Sessions are generated and stored in SQLite
- Auth helpers protect user access for protected routes and dashboards

## API Surface

The app includes API routes under `src/app/api` for:

- `auth/login`
- `auth/logout`
- `auth/me`
- `auth/signup`
- `users/profile`
- `users/settings`
- `workspaces`
- `workspaces/join`
- `channels`
- `dms`
- `messages`
- `notifications`
- `calendar`
- `meetings`
- `search`

## Design & UX

The frontend is built with a polished, modern interface that includes:

- gradient branding and glassmorphism panels
- responsive layouts
- dark/light themes
- animated landing pages and dashboard interactions
- Framer motion transitions

## Notes

This project is a full-stack collaboration app prototype and is ideal for:

- internal team communication
- project coordination
- startup or product team collaboration
- demoing a real-time communication product

## License

This project is currently unlicensed unless otherwise specified in the repository.

## Contributing

Contributions are welcome. If you want to extend the app, consider improving:

- message moderation and permissions
- file upload support
- richer search and indexing
- meeting quality and participant controls
- calendar/event management improvements
- deployment and environment configuration

If you are working on this project locally, start from the dashboard flow and explore the API routes and socket event handlers to understand how the app is structured.
