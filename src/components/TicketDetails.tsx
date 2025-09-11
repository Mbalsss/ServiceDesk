import React, { useState, useEffect } from "react";
import { X, FileText, AlertCircle } from "lucide-react";
import { Ticket } from "../types";
import { supabase } from "../lib/supabase";

interface TicketDetailsProps {
  ticket: Ticket;
  currentUserId: string;
  onResolved?: () => void;
  onClose?: () => void;
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
  critical: "text-red-700 bg-red-100",
  high: "text-orange-700 bg-orange-100",
  medium: "text-yellow-700 bg-yellow-100",
  low: "text-gray-700 bg-gray-100",
};

const TicketDetails: React.FC<TicketDetailsProps> = ({ 
  ticket, 
  currentUserId, 
  onResolved, 
  onClose 
}) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [status, setStatus] = useState(ticket.status);
  const [showFieldReportForm, setShowFieldReportForm] = useState(false);
  const [currentFieldReport, setCurrentFieldReport] = useState({
    work_performed: "",
    findings: "",
    recommendations: "",
    parts_used: ""
  });

  useEffect(() => {
    fetchComments();
    fetchFieldReports();
  }, []);

  // Close everything function
  const closeEverything = () => {
    setIsOpen(false);
    setShowFieldReportForm(false);
    if (onClose) {
      onClose();
    }
  };

  // Close field report form only
  const closeFieldReportForm = () => {
    setShowFieldReportForm(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeEverything();
    }
  };

  // Fetch comments
  async function fetchComments() {
    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*, technician_id:profiles!ticket_comments_technician_id_fkey(full_name)")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const fetched: CommentType[] = (data || []).map((c: any) => ({
      id: c.id,
      technician_name: c.technician_id?.full_name || "Unknown",
      comment: c.comment,
      created_at: c.created_at,
    }));
    setComments(fetched);
  }

  // Fetch field reports
  async function fetchFieldReports() {
    const { data, error } = await supabase
      .from("field_reports")
      .select("*, technician_id:profiles!field_reports_technician_id_fkey(full_name)")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const fetched: FieldReport[] = (data || []).map((r: any) => ({
      id: r.id,
      technician_name: r.technician_id?.full_name || "Unknown",
      work_performed: r.work_performed,
      findings: r.findings,
      recommendations: r.recommendations,
      parts_used: r.parts_used,
      created_at: r.created_at,
    }));
    setFieldReports(fetched);
  }

  // Add comment
  async function addComment() {
    if (!newComment.trim()) return;
    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      technician_id: currentUserId,
      comment: newComment.trim(),
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      return;
    }
    setNewComment("");
    fetchComments();
  }

  // Submit field report
  async function submitFieldReport() {
    if (!currentFieldReport.work_performed.trim() || !currentFieldReport.findings.trim()) {
      alert("Work performed and findings are required");
      return;
    }

    const { error } = await supabase.from("field_reports").insert({
      ticket_id: ticket.id,
      technician_id: currentUserId,
      work_performed: currentFieldReport.work_performed.trim(),
      findings: currentFieldReport.findings.trim(),
      recommendations: currentFieldReport.recommendations.trim(),
      parts_used: currentFieldReport.parts_used.trim(),
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error(error);
      alert("Error submitting field report");
      return;
    }
    
    // Update ticket status to indicate it needs further attention
    await updateStatus("open");
    
    setCurrentFieldReport({
      work_performed: "",
      findings: "",
      recommendations: "",
      parts_used: ""
    });
    setShowFieldReportForm(false);
    fetchFieldReports();
    alert("Field report submitted successfully");
  }

  // Update ticket status
  async function updateStatus(newStatus: string) {
    const { error } = await supabase
      .from("tickets")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
    if (error) {
      console.error(error);
      return;
    }
    setStatus(newStatus);
    if (newStatus === "resolved" && onResolved) onResolved();
  }

  // Request Approval
  async function requestApproval() {
    if (status === "closed") return;
    const { error } = await supabase
      .from("tickets")
      .update({ approval_requested: true })
      .eq("id", ticket.id);
    if (error) {
      console.error(error);
      return;
    }
    alert("Approval requested");
  }

  // Escalate Ticket
  async function escalateTicket() {
    if (status === "closed") return;
    const { error } = await supabase
      .from("tickets")
      .update({ escalated: true, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
    if (error) {
      console.error(error);
      return;
    }
    alert("Ticket escalated");
  }

  // Close ticket
  async function closeTicket() {
    const { error } = await supabase
      .from("tickets")
      .update({ status: "closed", updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
    if (error) {
      console.error(error);
      return;
    }
    setStatus("closed");
    closeEverything();
  }

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex justify-center items-center z-40 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      {/* Field Report Modal */}
      {showFieldReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Field Report</h3>
              <button onClick={closeFieldReportForm} className="text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Performed *</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={currentFieldReport.work_performed}
                  onChange={e => setCurrentFieldReport({...currentFieldReport, work_performed: e.target.value})}
                  placeholder="Describe the work you performed on this ticket..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Findings *</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={currentFieldReport.findings}
                  onChange={e => setCurrentFieldReport({...currentFieldReport, findings: e.target.value})}
                  placeholder="What did you discover during your investigation?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={currentFieldReport.recommendations}
                  onChange={e => setCurrentFieldReport({...currentFieldReport, recommendations: e.target.value})}
                  placeholder="What do you recommend as next steps?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parts Used</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={currentFieldReport.parts_used}
                  onChange={e => setCurrentFieldReport({...currentFieldReport, parts_used: e.target.value})}
                  placeholder="List any parts used (comma separated)"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  onClick={closeFieldReportForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitFieldReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Field Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-y-auto max-h-[90vh] p-6 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
          <button onClick={closeEverything} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Ticket Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Ticket Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Ticket ID:</strong> {ticket.id}</div>
              <div><strong>Type:</strong> {ticket.type.replace("_", " ")}</div>
              <div>
                <strong>Priority:</strong>{" "}
                <span className={`ml-2 px-2 py-1 rounded text-xs ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span className={`ml-2 px-2 py-1 rounded text-xs ${statusColors[status]}`}>
                  {status.replace("_", " ")}
                </span>
              </div>
              <div><strong>Requester:</strong> {ticket.requester_name}</div>
              <div><strong>Category:</strong> {ticket.category}</div>
              <div><strong>Estimated Time:</strong> {ticket.estimatedTime}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600">{ticket.description}</p>
          </div>

          {/* Image */}
          {ticket.image_url && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Attachment</h3>
              <img
                src={ticket.image_url}
                alt="Ticket attachment"
                className="max-w-full h-auto rounded border border-gray-200"
              />
            </div>
          )}

          {/* Field Reports */}
          {fieldReports.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2" /> Field Reports
              </h3>
              <div className="space-y-4 mb-4">
                {fieldReports.map(report => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium text-gray-900">{report.technician_name}</span>
                      <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString()}</span>
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
            <h3 className="text-lg font-medium text-gray-800 mb-2">Internal Comments</h3>
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
              {comments.length > 0 ? comments.map(c => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">{c.technician_name}</span>
                    <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-700">{c.comment}</p>
                </div>
              )) : <p className="text-gray-500">No comments yet.</p>}
            </div>
            <div className="border-t pt-4">
              <textarea
                placeholder="Add an internal comment..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button
                onClick={addComment}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Comment
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {status === "open" && (
              <button onClick={() => updateStatus("in_progress")} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Take Ticket
              </button>
            )}

            {status === "in_progress" && (
              <>
                <button onClick={() => updateStatus("resolved")} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Mark Resolved
                </button>
                
                <button 
                  onClick={() => setShowFieldReportForm(true)} 
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" /> Cannot Resolve
                </button>
              </>
            )}

            {status !== "closed" && (
              <>
                <button onClick={requestApproval} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Request Approval
                </button>
                <button onClick={escalateTicket} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Escalate
                </button>
              </>
            )}

            {status === "resolved" && (
              <button onClick={closeTicket} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Close Ticket
              </button>
            )}
          </div>

          {/* Footer Close Button */}
          <div className="border-t pt-4 flex justify-end">
            <button 
              onClick={closeEverything}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;