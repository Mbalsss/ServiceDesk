# IT Service Desk Application

A modern, feature-rich IT service desk application built with React, TypeScript, and Tailwind CSS. This application provides comprehensive incident management, Microsoft Teams integration, and AI-powered assistance through Microsoft 365 Copilot.

## Features

### Core Functionality
- **Ticket Management**: Create, track, and manage IT support tickets
- **Dashboard**: Real-time overview of ticket metrics and system status
- **User Management**: Role-based access control for users and technicians
- **Notifications**: Email notifications powered by EmailJS

### Technician Tools
- **Assigned Tickets**: View and manage assigned support tickets
- **Unassigned Queue**: Pick up tickets from the queue
- **Equipment Management**: Track and manage IT equipment
- **Field Reports**: Document field work and on-site visits
- **Internal Comments**: Private notes for technician collaboration
- **Performance Overview**: Track technician metrics and productivity

### User Features
- **My Tickets**: View personal ticket history
- **Create Ticket**: Submit new support requests
- **ChatBot**: AI-powered support assistant
- **Profile Settings**: Manage personal preferences and notification settings

### Advanced Features
- **Major Incident Management**: Handle critical incidents with dedicated workflow
- **Microsoft Teams Integration**: Connect with Teams for notifications and collaboration
- **Copilot Assistant**: AI-powered suggestions and automation
- **Reports & Analytics**: Comprehensive reporting with charts
- **Scheduler**: Plan and schedule maintenance windows
- **Automation**: Automate repetitive tasks
- **Reminders**: Set and manage task reminders
- **Announcements**: System-wide communication
- **Tech Availability**: Manage technician schedules

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Charts**: Chart.js, Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Email**: EmailJS
- **Microsoft Integration**:
  - @azure/msal-browser
  - @azure/msal-react
  - @microsoft/teams-js
  - @microsoft/microsoft-graph-client

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── technician/      # Technician-specific components
│   │   ├── user/            # User-specific components
│   │   ├── contexts/        # React contexts
│   │   └── hooks/           # Custom React hooks
│   ├── services/            # API and service layers
│   ├── types/               # TypeScript type definitions
│   ├── lib/                 # Library configurations
│   ├── utils/               # Utility functions
│   ├── assets/              # Static assets
│   └── App.tsx              # Main application component
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Supabase Edge Functions
├── public/                  # Public assets
└── appPackage/              # Microsoft Teams app package
```

## Database Schema

The application uses Supabase with the following main tables:
- `users`: User accounts and profiles
- `tickets`: Support tickets
- `ticket_updates`: Ticket comments and updates
- `technicians`: Technician profiles and availability
- `equipment`: IT equipment tracking
- `major_incidents`: Critical incident tracking

See `/supabase/migrations/` for detailed schema definitions.

## Authentication

The application uses Supabase Authentication with email/password login. User roles are managed through the database with Row Level Security (RLS) policies.

## Microsoft Teams Integration

The application includes Microsoft Teams integration for:
- Notifications in Teams channels
- OAuth authentication
- Teams app manifest for deployment

Configure Teams integration through the Settings page.

## Supabase Edge Functions

The application includes several edge functions:
- `invite-user`: Send invitation emails to new users
- `send-admin-notification`: Send notifications to administrators
- `teams-oauth`: Handle Microsoft Teams OAuth flow

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## License

ISC

## Support

For issues and questions, please create a ticket through the application or contact your IT administrator.
