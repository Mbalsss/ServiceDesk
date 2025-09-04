import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InternalCommentsProps {
  currentUser: { id: string; name: string };
  assignedTickets: any[];
  onViewTicket: (ticket: any) => void;
}

const InternalComments: React.FC<InternalCommentsProps> = ({
  currentUser,
  assignedTickets,
  onViewTicket
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTicket = assignedTickets.find(t => t.id === selectedTicketId);

  useEffect(() => {
    if (selectedTicketId) {
      fetchComments();
    } else {
      setComments([]);
    }
  }, [selectedTicketId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          technician:technician_id (name)
        `)
        .eq('ticket_id', selectedTicketId)
        .order('created_at', { ascending: true });

      if (supabaseError) throw supabaseError;

      const transformedComments = data?.map(comment => ({
        id: comment.id,
        ticket_id: comment.ticket_id,
        technician_id: comment.technician_id,
        technician_name: comment.technician?.name || 'Unknown',
        comment: comment.comment,
        created_at: comment.created_at
      })) || [];

      setComments(transformedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!selectedTicketId || !newComment.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: selectedTicketId,
          technician_id: currentUser.id,
          comment: newComment.trim(),
          created_at: new Date().toISOString()
        });

      if (supabaseError) throw supabaseError;

      setNewComment('');
      fetchComments(); // Refresh comments
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-800">Internal Comments</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Select a Ticket</h3>
          
          <select
            value={selectedTicketId}
            onChange={(e) => setSelectedTicketId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a ticket to discuss...</option>
            {assignedTickets.map(ticket => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.title} ({ticket.id.slice(0, 8)}...)
              </option>
            ))}
          </select>

          {selectedTicket && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-900">{selectedTicket.title}</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Status: {selectedTicket.status.replace('_', ' ')}</p>
                <p>Priority: {selectedTicket.priority}</p>
                <p>Requester: {selectedTicket.requester_name}</p>
              </div>
              <button
                onClick={() => onViewTicket(selectedTicket)}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                View full details
              </button>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Comments {selectedTicket && `(${comments.length})`}
          </h3>

          {!selectedTicket ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a ticket to view and add comments</p>
            </div>
          ) : (
            <>
              {/* Comments List */}
              <div className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No comments yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to comment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="font-medium text-sm text-gray-900">
                              {comment.technician_name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Comment */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Add Comment</h4>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your comment here..."
                  disabled={loading}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-3 resize-none"
                  rows={3}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim() || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Sending...' : 'Send Comment'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {assignedTickets.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedTickets.slice(0, 3).map(ticket => (
              <div
                key={ticket.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{ticket.id.slice(0, 8)}...</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Updated {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalComments;