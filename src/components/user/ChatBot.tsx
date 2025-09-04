import React, { useState, useRef, useEffect } from "react";
import { Bot, Send } from "lucide-react";

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
    { id: "1", sender: "bot", text: "Hello 👋 I’m your Service Desk assistant. What would you like to do today?" },
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

  const chatbotRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElement = useRef<Element | null>(null);

  useEffect(() => {
    // Save last focused element on open to return focus later
    if (isOpen) {
      lastFocusedElement.current = document.activeElement;
      // Focus chatbot container for screen reader users
      chatbotRef.current?.focus();
    } else if (lastFocusedElement.current instanceof HTMLElement) {
      // Return focus to last focused element when chatbot closes
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

  if (!isOpen) return null;

  return (
    <div
      ref={chatbotRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-heading"
      className="w-full max-w-md mx-auto border rounded-2xl shadow p-4 bg-white"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 id="chatbot-heading" className="text-xl font-bold flex items-center gap-2">
          <Bot size={20} /> Service Desk Chatbot
        </h2>
        <button
          aria-label="Close chatbot"
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-800 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 rounded"
        >
          ✕
        </button>
      </div>
      <div className="h-96 overflow-y-auto border p-2 rounded mb-2" aria-live="polite" aria-atomic="false">
        {messages.map((msg) => (
          <div key={msg.id} className={`my-1 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`px-3 py-2 rounded-2xl max-w-[75%] ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
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
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-2xl text-sm"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded-2xl px-3 py-2"
          aria-label="Type your message"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-3 py-2 rounded-2xl flex items-center gap-1"
          aria-label="Send message"
        >
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
};

export default ServiceDeskChatbot;
