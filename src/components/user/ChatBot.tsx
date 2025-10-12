import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Minimize2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

const troubleshootingSteps: Record<string, string[]> = {
  "Internet is slow": [
    "1️⃣ Check the Internet connection that the Player is connected to. Use a computer or a smartphone to make sure the Internet is up and running. ✅ Done?",
    "2️⃣ Check the network cable (both ends) on the Player, or the WiFi adapter if using one. Usually, there is a LED indicator on/blinking. Try unplugging the cable (or WiFi adapter), wait 15 seconds, and plug it in. ✅ Done?",
    "3️⃣ Check power connections: Ensure that the screen and Player are properly connected to the power outlet. ✅ Done?",
    "4️⃣ Reboot the Player. Important: wait at least 10 minutes between reboots. ✅ Done?",
    "5️⃣ If the above steps did not help, please reply and we will assist further!",
  ],
};

const createTicketSteps: string[] = [
  "Step 1️⃣: Enter a **Title** for your ticket. This should be a brief description of the issue or request.",
  "Step 2️⃣: Choose the **Type**: either 'Incident' or 'Service Request'.",
  "Step 3️⃣: Select the **Priority** of your ticket: Low, Medium, High, or Critical.",
  "Step 4️⃣: Pick a **Category**: Hardware, Software, Network, Email, User Management, Security.",
  "Step 5️⃣: Optionally, choose a **Subcategory** if applicable.",
  "Step 6️⃣: Enter your **Name** as the Requester.",
  "Step 7️⃣: Enter your **Email** so you can receive updates.",
  "Step 8️⃣: Optionally, select an **Assignee** or leave as Auto-assign.",
  "Step 9️⃣: Provide a **Description**: detailed info about the issue or request.",
  "✅ Once all fields are filled, click **Create Ticket** in the Service Desk. You will get notifications via Email and Microsoft Teams.",
];

const ServiceDeskChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "bot", text: "Hello 👋 I'm your Service Desk assistant. What would you like to do today?" },
  ]);

  const [options, setOptions] = useState<string[]>([
    "Create a Ticket",
    "Troubleshoot an Issue",
    "Check Ticket Status",
  ]);

  const [userInput, setUserInput] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeTroubleshoot, setActiveTroubleshoot] = useState<string | null>(null);
  const [ticketStepIndex, setTicketStepIndex] = useState<number>(0);
  const [guidingTicket, setGuidingTicket] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const chatbotRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<Element | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      lastFocusedElement.current = document.activeElement;
      chatbotRef.current?.focus();
    } else if (lastFocusedElement.current instanceof HTMLElement) {
      lastFocusedElement.current.focus();
    }
  }, [isOpen]);

  // Close chatbot on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const addBotMessage = (text: string) => {
    const botMessage: ChatMessage = { id: Date.now().toString() + "-bot", sender: "bot", text };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleOptionClick = (option: string) => {
    const newMessage: ChatMessage = { id: Date.now().toString(), sender: "user", text: option };
    setMessages((prev) => [...prev, newMessage]);

    if (option === "Create a Ticket") {
      setGuidingTicket(true);
      setTicketStepIndex(0);
      addBotMessage(createTicketSteps[0]);
      setOptions(["Next"]);
      return;
    }

    if (option === "Troubleshoot an Issue") {
      addBotMessage("Okay 🔧 What problem are you experiencing?");
      setOptions(["Internet is slow", "Email not working", "Password reset", "Printer issue"]);
      return;
    }

    if (option === "Check Ticket Status") {
      addBotMessage("Please enter your ticket ID to check its status.");
      setOptions([]);
      return;
    }

    if (option === "Internet is slow") {
      setActiveTroubleshoot("Internet is slow");
      setCurrentStepIndex(0);
      addBotMessage(troubleshootingSteps["Internet is slow"][0]);
      setOptions(["Done"]);
      return;
    }

    addBotMessage("Sorry, I didn't understand that. Please choose an option.");
  };

  const handleNextTicketStep = () => {
    const nextIndex = ticketStepIndex + 1;
    if (nextIndex < createTicketSteps.length) {
      setTicketStepIndex(nextIndex);
      addBotMessage(createTicketSteps[nextIndex]);
      setOptions(["Next"]);
    } else {
      setGuidingTicket(false);
      setTicketStepIndex(0);
      setOptions(["Create a Ticket", "Troubleshoot an Issue", "Check Ticket Status"]);
      addBotMessage("🎉 Ticket guide complete! You can now go to the Service Desk to create your ticket.");
    }
  };

  const handleStepDone = () => {
    if (!activeTroubleshoot) return;
    const steps = troubleshootingSteps[activeTroubleshoot];
    const nextIndex = currentStepIndex + 1;

    if (nextIndex < steps.length) {
      setCurrentStepIndex(nextIndex);
      addBotMessage(steps[nextIndex]);
      setOptions(nextIndex === steps.length - 1 ? [] : ["Done"]);
    } else {
      setActiveTroubleshoot(null);
      setCurrentStepIndex(0);
      setOptions(["Create a Ticket", "Troubleshoot an Issue", "Check Ticket Status"]);
      addBotMessage("✅ Troubleshooting complete. If the issue persists, reply here and we will assist further.");
    }
  };

  const handleSend = () => {
    if (!userInput.trim()) return;
    const newMessage: ChatMessage = { id: Date.now().toString(), sender: "user", text: userInput };
    setMessages((prev) => [...prev, newMessage]);
    setUserInput("");
    addBotMessage("Thanks for the info 👍 Our team will assist you shortly.");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        ref={chatbotRef}
        className="fixed bottom-4 right-4 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-lg"
      >
        <div className="flex items-center justify-between p-3 bg-[#5483B3] text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <Bot size={18} />
            <span className="font-semibold text-sm">Service Desk Assistant</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-[#476a8a] rounded transition-colors duration-200"
              aria-label="Maximize chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#476a8a] rounded transition-colors duration-200"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chatbotRef}
      className="fixed bottom-4 right-4 w-full max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col"
      style={{ height: "500px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[#5483B3] text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold text-sm sm:text-base">Service Desk Assistant</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-[#476a8a] rounded transition-colors duration-200"
            aria-label="Minimize chat"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-[#476a8a] rounded transition-colors duration-200"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 sm:px-4 py-2 rounded-2xl text-sm sm:text-base ${
                msg.sender === "user"
                  ? "bg-[#5483B3] text-white rounded-br-none"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Options */}
      {options.length > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-white border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (guidingTicket && opt === "Next") {
                    handleNextTicketStep();
                  } else if (opt === "Done") {
                    handleStepDone();
                  } else {
                    handleOptionClick(opt);
                  }
                }}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 border border-gray-300"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200 rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base transition-colors duration-200"
            aria-label="Type your message"
          />
          <button
            onClick={handleSend}
            disabled={!userInput.trim()}
            className="px-3 sm:px-4 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
            aria-label="Send message"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDeskChatbot;