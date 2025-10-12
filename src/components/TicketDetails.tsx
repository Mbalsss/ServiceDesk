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

// Aligned with CreateTicket component SLA calculation
const ESCALATION_THRESHOLDS = {
  critical: 4,    // 4 hours for critical tickets
  high: 8,        // 8 hours for high priority
  medium: 24,     // 24 hours for medium priority
  low: 72,        // 72 hours for low priority (aligned with CreateTicket)
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

// Safe date utility functions
const safeDate = (dateString: any): Date | null => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const safeToISOString = (date: any): string | null => {
  const validDate = safeDate(date);
  return validDate ? validDate.toISOString() : null;
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
  const [shouldEscalate, setShouldEscalate] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState("");
  const [slaDeadline, setSlaDeadline] = useState<string | null>(null);
  const [slaTimeRemaining, setSlaTimeRemaining] = useState<string | null>(null);

  // Calculate SLA deadline based on priority (same as CreateTicket)
  const calculateSLADeadline = useCallback((createdAt: string, priority: string): string | null => {
    const createdDate = safeDate(createdAt);
    if (!createdDate) return null;
    
    const threshold = ESCALATION_THRESHOLDS[priority as keyof typeof ESCALATION_THRESHOLDS] || 24;
    
    const deadline = new Date(createdDate.getTime() + threshold * 60 * 60 * 1000);
    return deadline.toISOString();
  }, []);

  // Calculate time remaining until SLA deadline
  const calculateTimeRemaining = useCallback((deadline: string | null): string | null => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = safeDate(deadline);
    if (!deadlineDate) return null;
    
    const timeDiff = deadlineDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return "Overdue";
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }, []);

  // Calculate if ticket should be escalated based on time
  const checkEscalationStatus = useCallback(() => {
    if (!ticket) return;

    const now = new Date();
    const createdDate = safeDate(ticket.created_at);
    if (!createdDate) return;
    
    const timeDiffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    const threshold = ESCALATION_THRESHOLDS[ticket.priority as keyof typeof ESCALATION_THRESHOLDS] || 24;
    
    // Format time elapsed for display
    const hours = Math.floor(timeDiffHours);
    const minutes = Math.floor((timeDiffHours - hours) * 60);
    setTimeElapsed(`${hours}h ${minutes}m`);
    
    // Calculate SLA deadline and time remaining
    const calculatedDeadline = calculateSLADeadline(ticket.created_at, ticket.priority);
    setSlaDeadline(calculatedDeadline);
    setSlaTimeRemaining(calculateTimeRemaining(calculatedDeadline));
    
    // Should escalate if:
    // - Ticket is not resolved or closed
    // - Time exceeded threshold for its priority
    // - Not already escalated
    const needsEscalation = 
      status !== "resolved" && 
      status !== "closed" && 
      !ticket.escalated && 
      timeDiffHours > threshold;
    
    setShouldEscalate(needsEscalation);
  }, [ticket, status, calculateSLADeadline, calculateTimeRemaining]);

  // Improved date formatting function
  const formatDateTime = useCallback((dateString: string | undefined | null) => {
    if (!dateString) {
      return "N/A";
    }
    
    try {
      const date = safeDate(dateString);
      if (!date) {
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
      checkEscalationStatus();
      
      // Update escalation status every minute
      const interval = setInterval(checkEscalationStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchComments, fetchFieldReports, ticket, checkEscalationStatus]);

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
    
    const createdAt = safeToISOString(new Date());
    if (!createdAt) {
      alert("Failed to create comment: Invalid date");
      setIsSubmitting(false);
      return;
    }
    
    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      technician_id: currentUserId,
      comment: newComment.trim(),
      created_at: createdAt,
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
    
    const updatedAt = safeToISOString(new Date());
    if (!updatedAt) {
      alert("Failed to update status: Invalid date");
      return;
    }
    
    const updateData: any = { 
      status: newStatus, 
      updated_at: updatedAt
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
      checkEscalationStatus(); // Re-check escalation after status change
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

  const escalateTicket = async () => {
    if (status === "closed") return;
    
    setIsSubmitting(true);
    try {
      const updatedAt = safeToISOString(new Date());
      const escalatedAt = safeToISOString(new Date());
      
      if (!updatedAt || !escalatedAt) {
        throw new Error("Invalid date values");
      }
      
      const { error } = await supabase
        .from("tickets")
        .update({ 
          escalated: true, 
          updated_at: updatedAt,
          escalated_at: escalatedAt,
          escalated_by: currentUserId
        })
        .eq("id", ticket.id);
        
      if (error) {
        throw error;
      }

      // Add a comment about the escalation
      const commentCreatedAt = safeToISOString(new Date());
      if (commentCreatedAt) {
        await supabase
          .from("ticket_comments")
          .insert({
            ticket_id: ticket.id,
            technician_id: currentUserId,
            comment: `🚨 TICKET ESCALATED - Exceeded ${ESCALATION_THRESHOLDS[ticket.priority as keyof typeof ESCALATION_THRESHOLDS]}h threshold for ${ticket.priority} priority`,
            created_at: commentCreatedAt,
          });
      }

      setShouldEscalate(false);
      alert("Ticket has been escalated to higher support level");
      onUpdate?.();
      fetchComments(); // Refresh to show the escalation comment
      
    } catch (error: any) {
      logSupabaseError("escalateTicket", error);
      alert("Failed to escalate ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeTicket = async () => {
    try {
      const updatedAt = safeToISOString(new Date());
      if (!updatedAt) {
        alert("Failed to close ticket: Invalid date");
        return;
      }
      
      const updateData: any = { 
        status: "closed", 
        updated_at: updatedAt,
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
      className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-y-auto max-h-[95vh] z-50 mx-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 p-4 sm:p-6 sticky top-0 bg-white z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{ticket.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Ticket #{ticket.ticket_number}</p>
          </div>
          <button 
            onClick={closeEverything} 
            className="flex-shrink-0 text-gray-500 hover:text-gray-800 transition-colors ml-2"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Ticket Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Ticket Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Ticket #:</span>
                    <span className="text-gray-600 font-mono">{ticket.ticket_number}</span>
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
                  {ticket.location && (
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span className="text-gray-600 text-right max-w-[150px] truncate" title={ticket.location}>
                        {ticket.location}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Time Open:</span>
                    <span className="text-gray-600">{timeElapsed}</span>
                  </div>
                  {slaTimeRemaining && (
                    <div className="flex justify-between">
                      <span className="font-medium">SLA Status:</span>
                      <span className={`font-medium ${
                        slaTimeRemaining === "Overdue" 
                          ? "text-red-600" 
                          : slaTimeRemaining.includes("h") && parseInt(slaTimeRemaining) < 2 
                            ? "text-orange-600" 
                            : "text-green-600"
                      }`}>
                        {slaTimeRemaining}
                      </span>
                    </div>
                  )}
                  {ticket.escalated && (
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className="text-red-600 font-medium">🚨 Escalated</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 flex items-center">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Status & Priority
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {ticket.priority} ({ESCALATION_THRESHOLDS[ticket.priority as keyof typeof ESCALATION_THRESHOLDS]}h SLA)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">Description</h3>
              <p className="text-gray-600 text-sm sm:text-base">{ticket.description}</p>
              
              {/* Image */}
              {ticket.image_url && (
                <div className="mt-4">
                  <h3 className="text-base font-medium text-gray-800 mb-2">Attachment</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={ticket.image_url}
                      alt="Ticket attachment"
                      className="w-full h-auto max-h-48 sm:max-h-60 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SLA Information */}
          {slaDeadline && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">SLA Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Priority Level: </span>
                  <span className="font-medium capitalize text-blue-900">{ticket.priority}</span>
                </div>
                <div>
                  <span className="text-blue-700">SLA Time: </span>
                  <span className="font-medium text-blue-900">
                    {ESCALATION_THRESHOLDS[ticket.priority as keyof typeof ESCALATION_THRESHOLDS]} hours
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Deadline: </span>
                  <span className="font-medium text-blue-900">
                    {formatDateTime(slaDeadline)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Status: </span>
                  <span className={`font-medium ${
                    slaTimeRemaining === "Overdue" 
                      ? "text-red-600" 
                      : slaTimeRemaining?.includes("h") && parseInt(slaTimeRemaining) < 2 
                        ? "text-orange-600" 
                        : "text-green-600"
                  }`}>
                    {slaTimeRemaining}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Escalation Warning */}
          {shouldEscalate && !ticket.escalated && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <h4 className="text-red-800 font-medium">Ticket Exceeded SLA Time Limit</h4>
                    <p className="text-red-600 text-sm">
                      This {ticket.priority} priority ticket has been open for {timeElapsed} 
                      (exceeds {ESCALATION_THRESHOLDS[ticket.priority as keyof typeof ESCALATION_THRESHOLDS]}h SLA)
                    </p>
                  </div>
                </div>
                <button
                  onClick={escalateTicket}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                      Escalating...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Escalate Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Field Reports */}
          {fieldReports.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Field Reports
              </h3>
              <div className="space-y-4">
                {fieldReports.map(report => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{report.technician_name}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(report.created_at)}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1 text-sm">Work Performed</h4>
                        <p className="text-gray-600 text-sm">{report.work_performed}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1 text-sm">Findings</h4>
                        <p className="text-gray-600 text-sm">{report.findings}</p>
                      </div>
                      
                      {report.recommendations && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1 text-sm">Recommendations</h4>
                          <p className="text-gray-600 text-sm">{report.recommendations}</p>
                        </div>
                      )}
                      
                      {report.parts_used && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1 text-sm">Parts Used</h4>
                          <p className="text-gray-600 text-sm">{report.parts_used}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Internal Comments
            </h3>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto p-1">
              {comments.length > 0 ? comments.map(c => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                    <span className="font-medium text-gray-900 text-sm">{c.technician_name}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{c.comment}</p>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet.</p>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <textarea
                placeholder="Add an internal comment..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={3}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button
                onClick={addComment}
                disabled={isSubmitting || !newComment.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center text-sm w-full sm:w-auto justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
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
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {status === "open" && (
                <button 
                  onClick={() => updateStatus("in_progress")} 
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex-1 sm:flex-none"
                >
                  Take Ticket
                </button>
              )}

              {status === "in_progress" && (
                <>
                  <button 
                    onClick={() => updateStatus("resolved")} 
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex-1 sm:flex-none"
                  >
                    Mark Resolved
                  </button>
                  
                  <button 
                    onClick={redirectToFieldReport}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm flex-1 sm:flex-none flex items-center justify-center"
                  >
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cannot Resolve
                  </button>
                </>
              )}

              {status !== "closed" && !shouldEscalate && !ticket.escalated && (
                <button 
                  onClick={escalateTicket} 
                  className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm flex-1 sm:flex-none flex items-center justify-center"
                >
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Manual Escalate
                </button>
              )}

              {status === "resolved" && (
                <button 
                  onClick={closeTicket} 
                  className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm flex-1 sm:flex-none"
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