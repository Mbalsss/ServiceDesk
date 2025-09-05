// TeamsChat.tsx
import React, { useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { Client } from '@microsoft/microsoft-graph-client';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: '<YOUR_CLIENT_ID>',
    authority: 'https://login.microsoftonline.com/<YOUR_TENANT_ID>',
    redirectUri: window.location.origin,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: string;
}

const TeamsChat: React.FC<{ teamId: string; channelId: string }> = ({ teamId, channelId }) => {
  const { instance, accounts } = useMsal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Initialize Microsoft Graph client
  const getGraphClient = (accessToken: string) => {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!accounts.length) return;
    const account = accounts[0];
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: ['Chat.ReadWrite', 'ChannelMessage.Send'],
      account,
    });

    const client = getGraphClient(tokenResponse.accessToken);
    const response = await client
      .api(`/teams/${teamId}/channels/${channelId}/messages`)
      .get();

    setMessages(response.value.map((msg: any) => ({
      id: msg.id,
      from: msg.from.user.displayName,
      content: msg.body.content,
      timestamp: msg.createdDateTime,
    })));
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !accounts.length) return;
    const account = accounts[0];
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: ['Chat.ReadWrite', 'ChannelMessage.Send'],
      account,
    });

    const client = getGraphClient(tokenResponse.accessToken);
    await client
      .api(`/teams/${teamId}/channels/${channelId}/messages`)
      .post({
        body: {
          content: newMessage,
        },
      });

    setNewMessage('');
    fetchMessages();
  };

  useEffect(() => {
    if (accounts.length) fetchMessages();
  }, [accounts]);

  return (
    <div className="p-4 border rounded shadow w-full max-w-md bg-white fixed bottom-6 right-6 z-50">
      <h2 className="font-bold mb-2">Team Chat</h2>
      <div className="h-64 overflow-y-auto mb-2 border p-2">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-1">
            <span className="font-semibold">{msg.from}:</span> {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border p-1 rounded"
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="bg-blue-500 text-white px-2 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Wrap in MSAL Provider
export const TeamsChatWrapper: React.FC<{ teamId: string; channelId: string }> = ({ teamId, channelId }) => (
  <MsalProvider instance={msalInstance}>
    <TeamsChat teamId={teamId} channelId={channelId} />
  </MsalProvider>
);
