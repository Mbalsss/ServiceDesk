import React, { useState } from 'react';
import { MessageSquare, Bot, Send, Lightbulb, Search, Zap, Clock, CheckCircle } from 'lucide-react';
import { copilotService, CopilotResponse } from '../services/copilotService';

interface CopilotMessage {
  id: string;
  type: 'user' | 'copilot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: any[];
  data?: any;
}

const CopilotAssistant: React.FC = () => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: '1',
      type: 'copilot',
      content: 'Hello! I\'m your Microsoft 365 Copilot assistant. I can help you with ticket management, knowledge base searches, and incident resolution. How can I assist you today?',
      timestamp: new Date(),
      suggestions: [
        'Create a new incident ticket',
        'Search for email server issues',
        'Show me critical tickets',
        'Find resolution for VPN problems'
      ]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get AI response from Copilot service
      const response: CopilotResponse = await copilotService.processQuery(inputMessage);
      
      const copilotResponse: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'copilot',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actions: response.actions,
        data: response.data
      };
      
      setMessages(prev => [...prev, copilotResponse]);
    } catch (error) {
      console.error('Error getting Copilot response:', error);
      
      const errorResponse: CopilotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'copilot',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        suggestions: ['Try rephrasing your question', 'Check system status', 'Contact support']
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleActionClick = (action: any) => {
    const actionMessage: CopilotMessage = {
      id: Date.now().toString(),
      type: 'copilot',
      content: `I'm executing the action: ${action.title}. ${action.description}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, actionMessage]);
    
    // Handle different action types
    if (action.type === 'create_ticket') {
      // Could trigger navigation to create ticket page
      console.log('Navigate to create ticket with data:', action.data);
    } else if (action.type === 'search_kb') {
      // Could open knowledge base article
      console.log('Open knowledge base article:', action.data);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Microsoft 365 Copilot</h2>
            <p className="text-gray-600">AI-powered assistance for ServiceDesk Plus Cloud</p>
          </div>
        </div>
      </div>

      {/* Copilot Features */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Smart Suggestions</p>
              <p className="text-xs text-gray-600">AI-powered recommendations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Knowledge Search</p>
              <p className="text-xs text-gray-600">Instant article lookup</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Auto Actions</p>
              <p className="text-xs text-gray-600">Automated workflows</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">24/7 Support</p>
              <p className="text-xs text-gray-600">Always available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Copilot Assistant</p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
                
                {/* Suggestions */}
                {message.suggestions && (
                  <div className="mt-3 space-y-1">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left px-2 py-1 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Actions */}
                {message.actions && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="flex items-center space-x-2 w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{action.title}</p>
                          <p className="text-xs">{action.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Data Display */}
                {message.data && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Related Information:</p>
                    {Array.isArray(message.data) ? (
                      <div className="space-y-1">
                        {message.data.slice(0, 3).map((item: any, index: number) => (
                          <div key={index} className="text-xs text-gray-700">
                            {item.title || item.name || item.id}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-700">
                        {message.data.title || message.data.content || JSON.stringify(message.data)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me about tickets, solutions, assignments, or anything else..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopilotAssistant;