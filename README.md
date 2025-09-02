# ServiceDesk Plus Cloud Application

A modern, feature-rich IT service desk application built with React, TypeScript, and Tailwind CSS. This application provides comprehensive incident management, Microsoft Teams integration, and AI-powered assistance through Microsoft 365 Copilot.

## 🚀 Features

### Core Functionality
- **Dashboard**: Real-time overview of tickets, metrics, and system status
- **Ticket Management**: Create, assign, track, and resolve incidents and service requests
- **Major Incident Management**: Coordinate critical incidents with dedicated workflows
- **Scheduler**: Manage maintenance windows, meetings, and on-call schedules
- **Tech Availability Chart**: Real-time view of technician status and workload
- **Task Management**: Assign and track team tasks with priority levels
- **Reminders**: Set and manage follow-ups and important deadlines
- **Announcements**: Team communications and system updates

### Microsoft Integration
- **Teams Integration**: Full ServiceDesk functionality within Microsoft Teams
- **Microsoft 365 Copilot**: AI-powered assistance for ticket resolution
- **Adaptive Cards**: Interactive notifications and actions in Teams
- **Real-time Notifications**: Instant updates via Teams channels

### Advanced Features
- **Real-time Updates**: Live status updates and notifications
- **Smart Assignment**: Intelligent ticket routing based on workload
- **Knowledge Base Integration**: AI-powered solution suggestions
- **Workflow Automation**: Automated escalation and routing rules

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Development**: Hot reload with Vite dev server

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd servicedesk-plus-cloud
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── TicketList.tsx   # Ticket management
│   ├── CreateTicket.tsx # Ticket creation form
│   ├── TicketDetails.tsx# Detailed ticket view
│   ├── MajorIncidentManagement.tsx
│   ├── Scheduler.tsx    # Calendar and scheduling
│   ├── TechAvailability.tsx
│   ├── Tasks.tsx        # Task management
│   ├── Reminders.tsx    # Reminder system
│   ├── Announcements.tsx# Team announcements
│   ├── CopilotAssistant.tsx # AI assistant
│   ├── TeamsIntegration.tsx # Teams features
│   ├── Header.tsx       # Application header
│   └── Sidebar.tsx      # Navigation sidebar
├── types/               # TypeScript type definitions
│   └── index.ts        # All interface definitions
├── utils/               # Utility functions
│   └── mockData.ts     # Sample data for development
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🎨 Key Components

### Dashboard
- Real-time metrics and KPIs
- Recent ticket overview
- Quick access to critical functions

### Ticket Management
- Create incidents and service requests
- Advanced filtering and search
- Real-time status updates
- Assignment and escalation workflows

### Microsoft Teams Integration
- Native Teams tab integration
- Adaptive card notifications
- Teams chat support
- Copilot AI assistance

### Major Incident Management
- Dedicated incident command center
- Real-time collaboration tools
- Status page integration
- Automated communications

## 🔧 Configuration

### Microsoft Teams Setup
1. Configure Teams app registration
2. Set up webhook endpoints
3. Enable Copilot integration
4. Configure notification channels

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_TEAMS_APP_ID=your-teams-app-id
VITE_COPILOT_ENDPOINT=your-copilot-endpoint
VITE_API_BASE_URL=your-api-base-url
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1024px and above)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎯 Usage Examples

### Creating a Ticket
1. Navigate to "Create Ticket" in the sidebar
2. Fill in the required information
3. Select appropriate priority and category
4. Submit to create and auto-assign

### Managing Major Incidents
1. Go to "Major Incidents" section
2. Declare a new major incident
3. Set up communication channels
4. Track progress and updates in real-time

### Using Copilot Assistant
1. Access the "Copilot Assistant" tab
2. Ask questions about tickets or solutions
3. Get AI-powered recommendations
4. Execute suggested actions directly

## 🔒 Security Features

- Role-based access control
- Secure API endpoints
- Data encryption in transit
- Audit logging for all actions

## 🚀 Deployment

### Production Build
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Deployment Options
- Static hosting (Netlify, Vercel, GitHub Pages)
- Container deployment (Docker)
- Cloud platforms (Azure, AWS, GCP)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔄 Changelog

### Version 1.0.0
- Initial release with core functionality
- Microsoft Teams integration
- Copilot AI assistant
- Major incident management
- Real-time notifications

## 🙏 Acknowledgments

- Microsoft Teams Platform team
- React and TypeScript communities
- Tailwind CSS team
- Lucide React icon library

---

Built with ❤️ for modern IT service management