import { ticketService } from './ticketService';
import { technicianService } from './technicianService';

export interface CopilotResponse {
  message: string;
  suggestions?: string[];
  actions?: CopilotAction[];
  data?: any;
}

export interface CopilotAction {
  id: string;
  title: string;
  description: string;
  type: 'create_ticket' | 'search_kb' | 'assign_ticket' | 'escalate' | 'update_status';
  data?: any;
}

class CopilotService {
  private knowledgeBase = [
    {
      id: '1',
      title: 'Email Server Issues',
      content: 'Common solutions: 1) Restart Outlook 2) Clear cache 3) Check server connectivity 4) Verify credentials',
      keywords: ['email', 'outlook', 'server', 'connection']
    },
    {
      id: '2',
      title: 'VPN Connection Problems',
      content: 'Troubleshooting steps: 1) Disconnect and reconnect 2) Try different server 3) Check firewall settings 4) Update VPN client',
      keywords: ['vpn', 'connection', 'network', 'remote']
    },
    {
      id: '3',
      title: 'Printer Issues',
      content: 'Common fixes: 1) Check paper and toner 2) Restart printer 3) Update drivers 4) Clear print queue',
      keywords: ['printer', 'printing', 'paper', 'jam']
    },
    {
      id: '4',
      title: 'Password Reset',
      content: 'Steps: 1) Verify user identity 2) Reset in Active Directory 3) Force password change on next login 4) Notify user',
      keywords: ['password', 'reset', 'login', 'account']
    }
  ];

  async processQuery(query: string): Promise<CopilotResponse> {
    const lowerQuery = query.toLowerCase();

    // Check for ticket creation requests
    if (this.isTicketCreationRequest(lowerQuery)) {
      return this.handleTicketCreation(query);
    }

    // Check for status update requests
    if (this.isStatusUpdateRequest(lowerQuery)) {
      return this.handleStatusUpdate(query);
    }

    // Check for assignment requests
    if (this.isAssignmentRequest(lowerQuery)) {
      return this.handleAssignment(query);
    }

    // Search knowledge base
    if (this.isKnowledgeSearchRequest(lowerQuery)) {
      return this.handleKnowledgeSearch(query);
    }

    // Check for dashboard/stats requests
    if (this.isDashboardRequest(lowerQuery)) {
      return this.handleDashboardRequest();
    }

    // Default response with suggestions
    return this.getDefaultResponse(query);
  }

  private isTicketCreationRequest(query: string): boolean {
    return query.includes('create') || query.includes('new ticket') || query.includes('submit');
  }

  private isStatusUpdateRequest(query: string): boolean {
    return query.includes('status') || query.includes('update') || query.includes('resolve') || query.includes('close');
  }

  private isAssignmentRequest(query: string): boolean {
    return query.includes('assign') || query.includes('technician') || query.includes('who can');
  }

  private isKnowledgeSearchRequest(query: string): boolean {
    return query.includes('how to') || query.includes('solution') || query.includes('fix') || query.includes('help');
  }

  private isDashboardRequest(query: string): boolean {
    return query.includes('dashboard') || query.includes('stats') || query.includes('metrics') || query.includes('overview');
  }

  private async handleTicketCreation(query: string): Promise<CopilotResponse> {
    const category = this.extractCategory(query);
    const priority = this.extractPriority(query);

    return {
      message: `I can help you create a new ticket. Based on your description, I suggest categorizing this as "${category}" with "${priority}" priority. Would you like me to pre-fill a ticket form?`,
      actions: [
        {
          id: 'create_ticket',
          title: 'Create New Ticket',
          description: 'Open ticket creation form with suggested details',
          type: 'create_ticket',
          data: { category, priority }
        }
      ],
      suggestions: [
        'What type of issue are you experiencing?',
        'Who is the requester?',
        'How many users are affected?'
      ]
    };
  }

  private async handleStatusUpdate(query: string): Promise<CopilotResponse> {
    try {
      const tickets = await ticketService.getAllTickets();
      const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');

      return {
        message: `I found ${openTickets.length} tickets that can be updated. Which ticket would you like to update?`,
        data: openTickets.slice(0, 5),
        actions: [
          {
            id: 'update_status',
            title: 'Update Ticket Status',
            description: 'Change status of selected ticket',
            type: 'update_status'
          }
        ]
      };
    } catch (error) {
      return {
        message: 'I encountered an error while fetching tickets. Please try again.',
        suggestions: ['Check ticket list manually', 'Refresh the page']
      };
    }
  }

  private async handleAssignment(query: string): Promise<CopilotResponse> {
    try {
      const availableTechs = await technicianService.getAvailableTechnicians();
      
      if (availableTechs.length === 0) {
        return {
          message: 'Currently, no technicians are available for assignment. All team members are busy or away.',
          suggestions: [
            'Check technician availability chart',
            'Escalate to manager',
            'Schedule for later assignment'
          ]
        };
      }

      const bestTech = availableTechs.sort((a, b) => a.workload - b.workload)[0];

      return {
        message: `I recommend assigning to ${bestTech.name} who has the lowest workload (${bestTech.workload}%). ${availableTechs.length} technicians are currently available.`,
        data: availableTechs,
        actions: [
          {
            id: 'assign_ticket',
            title: 'Assign to Recommended Technician',
            description: `Assign to ${bestTech.name}`,
            type: 'assign_ticket',
            data: { technician: bestTech.name }
          }
        ]
      };
    } catch (error) {
      return {
        message: 'I encountered an error while checking technician availability. Please check the Tech Availability chart manually.',
        suggestions: ['View Tech Availability Chart', 'Assign manually']
      };
    }
  }

  private handleKnowledgeSearch(query: string): Promise<CopilotResponse> {
    const matchingArticles = this.knowledgeBase.filter(article =>
      article.keywords.some(keyword => query.toLowerCase().includes(keyword))
    );

    if (matchingArticles.length > 0) {
      const bestMatch = matchingArticles[0];
      return Promise.resolve({
        message: `I found a solution for your issue: ${bestMatch.title}`,
        data: bestMatch,
        suggestions: [
          'Try the suggested solution',
          'Create a ticket if issue persists',
          'Search for more specific solutions'
        ],
        actions: [
          {
            id: 'search_kb',
            title: 'View Full Article',
            description: 'Open detailed troubleshooting guide',
            type: 'search_kb',
            data: bestMatch
          }
        ]
      });
    }

    return Promise.resolve({
      message: 'I couldn\'t find a specific solution in our knowledge base. Let me help you create a ticket or search for more information.',
      suggestions: [
        'Create a new ticket for this issue',
        'Contact a technician directly',
        'Try a different search term'
      ]
    });
  }

  private async handleDashboardRequest(): Promise<CopilotResponse> {
    try {
      const stats = await ticketService.getDashboardStats();
      const technicians = await technicianService.getAllTechnicians();
      
      const availableTechs = technicians.filter(t => t.status === 'available').length;
      const busyTechs = technicians.filter(t => t.status === 'busy').length;

      return {
        message: `Here's your current overview: ${stats.totalTickets} total tickets, ${stats.openTickets} open, ${stats.inProgressTickets} in progress, ${stats.criticalTickets} critical. Team status: ${availableTechs} available, ${busyTechs} busy technicians.`,
        data: { stats, technicians: { available: availableTechs, busy: busyTechs } },
        suggestions: [
          'View detailed dashboard',
          'Check critical tickets',
          'Review team workload'
        ]
      };
    } catch (error) {
      return {
        message: 'I encountered an error while fetching dashboard data. Please check the dashboard manually.',
        suggestions: ['Refresh dashboard', 'Check system status']
      };
    }
  }

  private getDefaultResponse(query: string): CopilotResponse {
    return {
      message: 'I\'m here to help with your ServiceDesk needs. I can assist with creating tickets, checking status, finding solutions, and managing assignments. What would you like to do?',
      suggestions: [
        'Create a new ticket',
        'Check ticket status',
        'Find available technicians',
        'Search for solutions',
        'View dashboard overview'
      ],
      actions: [
        {
          id: 'create_ticket',
          title: 'Create New Ticket',
          description: 'Start a new incident or service request',
          type: 'create_ticket'
        },
        {
          id: 'search_kb',
          title: 'Search Knowledge Base',
          description: 'Find solutions and troubleshooting guides',
          type: 'search_kb'
        }
      ]
    };
  }

  private extractCategory(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('email') || lowerQuery.includes('outlook')) return 'Email';
    if (lowerQuery.includes('network') || lowerQuery.includes('vpn') || lowerQuery.includes('internet')) return 'Network';
    if (lowerQuery.includes('printer') || lowerQuery.includes('print')) return 'Hardware';
    if (lowerQuery.includes('password') || lowerQuery.includes('login') || lowerQuery.includes('account')) return 'User Management';
    if (lowerQuery.includes('software') || lowerQuery.includes('application') || lowerQuery.includes('program')) return 'Software';
    return 'General';
  }

  private extractPriority(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('urgent') || lowerQuery.includes('critical') || lowerQuery.includes('down') || lowerQuery.includes('emergency')) return 'critical';
    if (lowerQuery.includes('high') || lowerQuery.includes('important') || lowerQuery.includes('asap')) return 'high';
    if (lowerQuery.includes('low') || lowerQuery.includes('minor') || lowerQuery.includes('when possible')) return 'low';
    return 'medium';
  }
}

export const copilotService = new CopilotService();