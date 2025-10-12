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

  // Color scheme matching the reports page
  const colors = {
    primary: '#5483B3',      // Brand Blue
    primaryLight: '#7BA4D0', // Light Blue
    secondary: '#5AB8A8',    // Teal
    accent: '#D0857B',       // Red
    dark: '#3A5C80',         // Dark Blue
    gray: '#607d8b',         // Gray
    background: '#F0F5FC',   // Light Blue Background
    success: '#5AB8A8',      // Teal for success
    warning: '#D0857B',      // Red for warnings
  };

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#5483B3] to-[#3A5C80] rounded-xl flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Microsoft 365 Copilot</h1>
              <p className="text-gray-600 mt-1">AI-powered assistance for ServiceDesk Plus Cloud</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#F0F5FC] rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-[#5483B3]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Smart Suggestions</p>
                <p className="text-xs text-gray-600 mt-0.5">AI-powered recommendations</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-[#5AB8A8]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Knowledge Search</p>
                <p className="text-xs text-gray-600 mt-0.5">Instant article lookup</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#7BA4D0]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Auto Actions</p>
                <p className="text-xs text-gray-600 mt-0.5">Automated workflows</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#D0857B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">24/7 Support</p>
                <p className="text-xs text-gray-600 mt-0.5">Always available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#5483B3] to-[#7BA4D0]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Copilot Assistant</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                  <span className="text-xs text-green-100">Online - Ready to help</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-[#5483B3] to-[#3A5C80] text-white shadow-sm' 
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  
                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-500">Quick suggestions:</p>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors duration-150"
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
                          className="flex items-center space-x-3 w-full px-4 py-3 bg-[#F0F5FC] text-[#5483B3] rounded-lg hover:bg-[#E1EBF7] transition-colors duration-150 border border-[#7BA4D0]/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <div className="text-left flex-1">
                            <p className="text-sm font-semibold">{action.title}</p>
                            <p className="text-xs text-[#3A5C80] mt-0.5">{action.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Data Display */}
                  {message.data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">Related Information:</p>
                      {Array.isArray(message.data) ? (
                        <div className="space-y-2">
                          {message.data.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded border border-gray-300">
                              {item.title || item.name || item.id}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 p-2 bg-white rounded border border-gray-300">
                          {message.data.title || message.data.content || JSON.stringify(message.data)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Copilot is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me about tickets, solutions, assignments, or anything else..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="p-3 bg-gradient-to-br from-[#5483B3] to-[#3A5C80] text-white rounded-lg hover:from-[#4A76A0] hover:to-[#2E4A6B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Copilot can help with ticket management, knowledge searches, and incident resolution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopilotAssistant;