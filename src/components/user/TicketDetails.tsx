import React, { useState, useEffect } from 'react';
import { X, Clock, User, Tag, AlertCircle, Calendar, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  updated_at: string;
  ticket_number: string;
  type: string;
  category: string;
  requester_name: string;
  image_url?: string;
}

interface TicketDetailsProps {
  ticket: Ticket;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface Comment {
  id: string;
  comment: string; // Changed from 'content' to 'comment'
  created_at: string;
  author_name?: string;
  author_role?: string;
  is_internal?: boolean;
  technician_id?: string;
}

interface FieldReport {
  id: string;
  description: string;
  report_date: string;
  technician_name: string;
  report_type: string;
  work_hours: number;
  parts_used: string;
  customer_name: string;
  site_location: string;
  created_at: string;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [fieldReportsError, setFieldReportsError] = useState<string | null>(null);

  // Fetch comments from ticket_comments table
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('ticket_comments')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching comments:', error);
          setCommentsError('Unable to load comments');
          setComments([]);
          return;
        }

        if (data) {
          setComments(data);
          setCommentsError(null);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setCommentsError('Unable to load comments');
        setComments([]);
      }
    };

    fetchComments();
  }, [ticket.id]);

  // Fetch field reports
  useEffect(() => {
    const fetchFieldReports = async () => {
      try {
        const { data, error } = await supabase
          .from('field_reports')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching field reports:', error);
          setFieldReportsError('Unable to load field reports');
          setFieldReports([]);
          return;
        }

        if (data) {
          setFieldReports(data);
          setFieldReportsError(null);
        }
      } catch (error) {
        console.error('Error fetching field reports:', error);
        setFieldReportsError('Unable to load field reports');
        setFieldReports([]);
      }
    };

    fetchFieldReports();
  }, [ticket.id]);

  // Load image preview if available
  useEffect(() => {
    if (ticket.image_url) {
      setImagePreview(ticket.image_url);
    }
  }, [ticket.image_url]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ticket_comments') // Using correct table name
        .insert({
          ticket_id: ticket.id,
          comment: newComment, // Using correct column name
          technician_id: null // For user comments, technician_id is null
        });

      if (error) {
        console.error('Error adding comment:', error);
        alert('Unable to add comment. Please try again.');
        return;
      }

      setNewComment('');
      
      // Refresh comments
      const { data } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (data) {
        setComments(data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Unable to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#5483B3]" />
            <h2 className="text-xl font-semibold text-gray-900">
              #{ticket.ticket_number}
            </h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
            {ticket.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Ticket Details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Ticket Details Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
                <div className="space-y-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Priority
                    </label>
                    <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Type
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      {ticket.type.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Category
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      {ticket.category.toUpperCase()}
                    </div>
                  </div>

                  {/* Requester */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Requester
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{ticket.requester_name}</span>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Created
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Last Updated
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {formatDate(ticket.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Reports */}
              {fieldReports.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Reports</h3>
                  <div className="space-y-4">
                    {fieldReports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{report.technician_name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                        {report.work_hours && (
                          <p className="text-sm text-gray-600">Work Hours: {report.work_hours}</p>
                        )}
                        {report.parts_used && (
                          <p className="text-sm text-gray-600">Parts Used: {report.parts_used}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Help Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Need Help?</h4>
                </div>
                <p className="text-blue-800 text-sm">
                  If you need to update any information about this ticket or have additional questions, 
                  please add a comment and our support team will assist you.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Description */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket.title}</h1>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Attached Image</h3>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Ticket attachment"
                      className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200"
                    />
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Comments & Updates</h3>
                </div>

                {/* Comments List */}
                <div className="space-y-4 mb-6">
                  {commentsError ? (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">{commentsError}</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to add a comment</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 rounded-lg border bg-gray-50 border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">
                            {comment.technician_id ? 'Support Team' : 'You'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatCommentDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Add a comment
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your comment here..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || loading}
                      className="px-6 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;