import React, { useState, useEffect, useCallback } from "react";
import { X, FileText, AlertCircle, MessageSquare, Clock, User, Tag, AlertTriangle } from "lucide-react";
import { Ticket } from "../types";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface TicketDetailsProps {
  ticket: Ticket | null;
  currentUserId: string;
  currentUserName: string;
  onResolved?: () => void;
  onClose?: () => void;
  onUpdate?: () => void;
}

interface CommentType {
  id: string;
  technician_name: string;
  comment: string;
  created_at: string;
}

interface FieldReport {
  id: string;
  technician_name: string;
  work_performed: string;
  findings: string;
  recommendations: string;
  parts_used: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: "text-blue-600 bg-blue-100 border-blue-200",
  in_progress: "text-orange-600 bg-orange-100 border-orange-200",
  resolved: "text-green-600 bg-green-100 border-green-200",
  closed: "text-gray-600 bg-gray-100 border-gray-200",
};

const priorityColors: Record<string, string> = {
  critical: "text-red-700 bg-red-100 border border-red-200",
  high: "text-orange-700 bg-orange-100 border border-orange-200",
  medium: "text-yellow-700 bg-yellow-100 border border-yellow-200",
  low: "text-gray-700 bg-gray-100 border border-gray-200",
};

// Error logging utility
const logSupabaseError = (operation: string, error: any) => {
  console.error(`Supabase Error in ${operation}:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
};

const TicketDetails: React.FC<TicketDetailsProps> = ({ 
  ticket, 
  currentUserId, 
  currentUserName,
  onResolved, 
  onClose,
  onUpdate
}) => {
  const navigate = useNavigate();
  
  if (!ticket) {
    console.warn("TicketDetails received a null ticket prop.");
    return null;
  }

  const [comments, setComments] = useState<CommentType[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState(ticket.status); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Improved date formatting function
  const formatDateTime = useCallback((dateString: string | undefined | null) => {
    if (!dateString) {
      return "N/A";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Error Date";
    }
  }, []);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("ticket_comments")
      .select(`
        id,
        comment,
        created_at,
        profiles!ticket_comments_technician_id_fkey (
          full_name
        )
      `)
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (error) {
      logSupabaseError("fetchComments", error);
      return;
    }

    const fetched: CommentType[] = (data || []).map((c: any) => ({
      id: c.id,
      technician_name: c.profiles?.full_name || "Unknown",
      comment: c.comment,
      created_at: c.created_at,
    }));
    setComments(fetched);
  }, [ticket.id]);

  const fetchFieldReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("field_reports")
        .select(`
          id,
          work_performed,
          findings,
          recommendations,
          parts_used,
          created_at,
          profiles!field_reports_technician_id_fkey (
            full_name
          )
        `)
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: false });

      if (error) {
        logSupabaseError("fetchFieldReports", error);
        
        // If it's a schema error, try a simpler query
        if (error.code === '42703' || error.message.includes('profiles')) {
          console.log("Trying simpler field reports query...");
          const { data: simpleData, error: simpleError } = await supabase
            .from("field_reports")
            .select("id, work_performed, findings, recommendations, parts_used, created_at, technician_id")
            .eq("ticket_id", ticket.id)
            .order("created_at", { ascending: false });
            
          if (simpleError) {
            throw simpleError;
          }
          
          // Manually fetch technician names
          const reportsWithNames = await Promise.all(
            (simpleData || []).map(async (report: any) => {
              let technician_name = "Unknown";
              if (report.technician_id) {
                const { data: profileData } = await supabase
                  .from("profiles")
                  .select("full_name")
                  .eq("id", report.technician_id)
                  .single();
                  
                technician_name = profileData?.full_name || "Unknown";
              }
              
              return {
                id: report.id,
                technician_name,
                work_performed: report.work_performed,
                findings: report.findings,
                recommendations: report.recommendations,
                parts_used: report.parts_used,
                created_at: report.created_at,
              };
            })
          );
          
          setFieldReports(reportsWithNames);
          return;
        }
        
        throw error;
      }

      const fetched: FieldReport[] = (data || []).map((r: any) => ({
        id: r.id,
        technician_name: r.profiles?.full_name || "Unknown",
        work_performed: r.work_performed,
        findings: r.findings,
        recommendations: r.recommendations,
        parts_used: r.parts_used,
        created_at: r.created_at,
      }));
      setFieldReports(fetched);
    } catch (error) {
      logSupabaseError("fetchFieldReports", error);
      // Set empty array to prevent UI errors
      setFieldReports([]);
    }
  }, [ticket.id]);

  useEffect(() => {
    if (ticket) { 
      fetchComments();
      fetchFieldReports();
    }
  }, [fetchComments, fetchFieldReports, ticket]);

  const closeEverything = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeEverything();
    }
  }, [closeEverything]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      technician_id: currentUserId,
      comment: newComment.trim(),
      created_at: new Date().toISOString(),
    });
    
    setIsSubmitting(false);
    
    if (error) {
      logSupabaseError("addComment", error);
      alert("Failed to add comment");
      return;
    }
    
    setNewComment("");
    fetchComments();
  };

  const updateStatus = async (newStatus: string) => {
    console.log("Updating status to:", newStatus);
    
    const updateData: any = { 
      status: newStatus, 
      updated_at: new Date().toISOString()
    };
    
    // Only add assigned_to if we're moving to in_progress
    if (newStatus === "in_progress") {
      updateData.assigned_to = currentUserId;
    }
    
    try {
      const { error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", ticket.id);
        
      if (error) {
        console.error("Full update error:", error);
        throw error;
      }
      
      setStatus(newStatus);
      onUpdate?.();
      if (newStatus === "resolved") onResolved?.();
      
    } catch (error: any) {
      console.error("Error updating status:", error);
      
      // More specific error messages
      if (error.code === '42501') {
        alert("Permission denied. You may not have rights to update this ticket.");
      } else if (error.code === '23505') {
        alert("Database constraint violation. This may be a duplicate operation.");
      } else {
        alert(`Failed to update status: ${error.message}`);
      }
    }
  };

  const requestApproval = async () => {
    if (status === "closed") return;
    
    const { error } = await supabase
      .from("tickets")
      .update({ approval_requested: true })
      .eq("id", ticket.id);
      
    if (error) {
      logSupabaseError("requestApproval", error);
      alert("Failed to request approval");
      return;
    }
    
    alert("Approval requested");
    onUpdate?.();
  };

  const escalateTicket = async () => {
    if (status === "closed") return;
    
    const { error } = await supabase
      .from("tickets")
      .update({ 
        escalated: true, 
        updated_at: new Date().toISOString(),
        escalated_at: new Date().toISOString(),
        escalated_by: currentUserId
      })
      .eq("id", ticket.id);
      
    if (error) {
      logSupabaseError("escalateTicket", error);
      alert("Failed to escalate ticket");
      return;
    }
    
    alert("Ticket escalated");
    onUpdate?.();
  };

  const closeTicket = async () => {
    try {
      const updateData: any = { 
        status: "closed", 
        updated_at: new Date().toISOString(),
        closed_by: currentUserId
      };
      
      const { error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", ticket.id);
        
      if (error) {
        console.error("Full close error:", error);
        throw error;
      }
      
      setStatus("closed");
      onUpdate?.();
      closeEverything();
      
    } catch (error: any) {
      console.error("Error closing ticket:", error);
      alert(`Failed to close ticket: ${error.message}`);
    }
  };

  // Function to redirect to Field Report page
  const redirectToFieldReport = () => {
    if (!ticket) return;
    
    // Close the ticket details modal first
    closeEverything();
    
    // Navigate to field report page with ticket info
    navigate('/field-report', { 
      state: { 
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        customerName: ticket.requester_name,
        siteLocation: ticket.location || '',
        presetDescription: `Cannot resolve ticket #${ticket.ticket_number}: ${ticket.title}`
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex justify-center items-center z-40 bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-y-auto max-h-[90vh] z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 p-6 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
          <button 
            onClick={closeEverything} 
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Ticket Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" /> Ticket Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Ticket ID:</span>
                    <span className="text-gray-600">{ticket.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="text-gray-600 capitalize">{ticket.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Requester:</span>
                    <span className="text-gray-600">{ticket.requester_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Category:</span>
                    <span className="text-gray-600">{ticket.category}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <Tag className="w-5 h-5 mr-2" /> Status & Priority
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Priority:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Estimated Time:</span>
                    <span className="text-gray-600">{ticket.estimatedTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Description</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{ticket.description}</p>
              
              {/* Image */}
              {ticket.image_url && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Attachment</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={ticket.image_url}
                      alt="Ticket attachment"
                      className="w-full h-auto max-h-60 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Field Reports */}
          {fieldReports.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" /> Field Reports
              </h3>
              <div className="space-y-4">
                {fieldReports.map(report => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium text-gray-900">{report.technician_name}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(report.created_at)}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Work Performed</h4>
                        <p className="text-gray-600">{report.work_performed}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Findings</h4>
                        <p className="text-gray-600">{report.findings}</p>
                      </div>
                      
                      {report.recommendations && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Recommendations</h4>
                          <p className="text-gray-600">{report.recommendations}</p>
                        </div>
                      )}
                      
                      {report.parts_used && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">Parts Used</h4>
                          <p className="text-gray-600">{report.parts_used}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" /> Internal Comments
            </h3>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto p-1">
              {comments.length > 0 ? comments.map(c => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">{c.technician_name}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-gray-700">{c.comment}</p>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No comments yet.</p>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <textarea
                placeholder="Add an internal comment..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button
                onClick={addComment}
                disabled={isSubmitting || !newComment.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Comment"
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {status === "open" && (
                <button 
                  onClick={() => updateStatus("in_progress")} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Take Ticket
                </button>
              )}

              {status === "in_progress" && (
                <>
                  <button 
                    onClick={() => updateStatus("resolved")} 
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Mark Resolved
                  </button>
                  
                  <button 
                    onClick={redirectToFieldReport}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" /> Cannot Resolve
                  </button>
                </>
              )}

              {status !== "closed" && (
                <>
                  <button 
                    onClick={requestApproval} 
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Request Approval
                  </button>
                  <button 
                    onClick={escalateTicket} 
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" /> Escalate
                  </button>
                </>
              )}

              {status === "resolved" && (
                <button 
                  onClick={closeTicket} 
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;