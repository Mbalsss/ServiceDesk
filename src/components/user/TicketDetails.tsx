import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
} from "lucide-react";
import { Ticket, Comment } from "../../types";
import { supabase } from "../../lib/supabase";

interface TicketDetailsProps {
  ticket: Ticket;
  onBack: () => void;
  currentUser: { id: string; name: string; email: string };
}

const statusStyles = {
  open: { icon: <AlertCircle className="w-4 h-4 text-blue-600" />, label: "Open" },
  in_progress: {
    icon: <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />,
    label: "In Progress",
  },
  resolved: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, label: "Resolved" },
  closed: { icon: <CheckCircle className="w-4 h-4 text-purple-600" />, label: "Closed" },
};

const priorityStyles = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onBack,
  currentUser,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    fetchComments();
  }, [ticket.numeric_id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
            id,
            content,
            created_at,
            author:author_id(full_name, email),
            attachments
          `
        )
        .eq("ticket_id", ticket.numeric_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedComments: Comment[] = data.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: new Date(comment.created_at),
          author: comment.author ? comment.author.full_name : "Unknown",
          attachments: comment.attachments || [],
        }));
        setComments(formattedComments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;

    setSubmitting(true);
    try {
      let attachmentUrls: string[] = [];

      if (attachments.length > 0) {
        // Placeholder for uploading attachments
        console.log("Attach files upload:", attachments);
      }

      const { error } = await supabase.from("comments").insert([
        {
          content: newComment,
          ticket_id: ticket.numeric_id,
          author_id: currentUser.id,
          attachments: attachmentUrls,
        },
      ]);

      if (error) throw error;

      setNewComment("");
      setAttachments([]);
      await fetchComments();
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setAttachments(Array.from(files));
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString() + " " + date.toLocaleTimeString();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-md shadow border border-gray-200 select-text text-sm">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="p-1 rounded hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex flex-col leading-none">
          <h1 className="text-lg font-semibold text-gray-900">{ticket.title}</h1>
          <span className="text-gray-500 tracking-wide">#{ticket.id}</span>
        </div>
        <div className="ml-auto flex gap-2 items-center text-xs font-medium capitalize select-none">
          <div
            title={statusStyles[ticket.status]?.label || "Unknown Status"}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
          >
            {statusStyles[ticket.status]?.icon || <AlertCircle className="w-4 h-4" />}
            <span>{ticket.status.replace("_", " ")}</span>
          </div>
          <div
            className={`px-2 py-0.5 rounded-full ${
              priorityStyles[ticket.priority] || priorityStyles.low
            }`}
            title={`Priority: ${ticket.priority}`}
          >
            {ticket.priority}
          </div>
        </div>
      </header>

      {/* Ticket Summary and Meta */}
      <section className="grid md:grid-cols-3 gap-6 px-4 py-4 border-b border-gray-200">
        <article className="md:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-1">Description</h2>
          <p className="text-gray-700 whitespace-pre-line leading-tight">
            {ticket.description}
          </p>
        </article>

        <aside className="text-gray-700 space-y-2 leading-snug">
          <div>
            <p className="font-semibold text-gray-900">Type</p>
            <p className="capitalize">{ticket.type}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Category</p>
            <p>{ticket.category || "None"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Assignee</p>
            <p>{ticket.assignee}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Requester</p>
            <p>{ticket.requester}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Created</p>
            <p>{formatDate(ticket.createdAt)}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Updated</p>
            <p>{formatDate(ticket.updatedAt)}</p>
          </div>
        </aside>
      </section>

      {/* Comments Section */}
      <section className="px-4 py-4">
        <h3 className="flex items-center gap-1 text-gray-900 font-semibold mb-3 border-b border-gray-200 pb-2">
          <MessageSquare className="w-4 h-4 text-gray-700" />
          Comments & Updates
        </h3>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 select-none">
            <MessageSquare className="w-10 h-10 mx-auto mb-1 text-gray-300" />
            <p>No comments yet</p>
          </div>
        ) : (
          <ul className="space-y-4 mb-6">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="border rounded-md p-3 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-1 text-xs text-gray-700 font-medium">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {comment.author}
                  </div>
                  <time
                    dateTime={comment.createdAt.toISOString()}
                    title={comment.createdAt.toLocaleString()}
                    className="select-none"
                  >
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-tight text-sm">
                  {comment.content}
                </p>
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {comment.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                        >
                          <Paperclip className="w-3 h-3" />
                          File {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add Comment Form */}
        <form
          onSubmit={handleSubmitComment}
          className="border border-gray-300 rounded-md p-3 bg-white"
        >
          <label
            htmlFor="comment"
            className="block text-gray-700 text-sm font-medium mb-1"
          >
            Add a Comment
          </label>
          <textarea
            id="comment"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Write your thoughts or updates here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 select-none">
              <Paperclip className="w-4 h-4" />
              Attach files
              <input
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
                disabled={submitting}
              />
            </label>
            {attachments.length > 0 && (
              <p className="text-gray-600">
                {attachments.length} file{attachments.length > 1 ? "s" : ""} selected
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || (!newComment.trim() && attachments.length === 0)}
              className="ml-auto flex items-center gap-1 px-4 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default TicketDetails;
