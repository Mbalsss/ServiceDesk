import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

const KnowledgeBase: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formArticle, setFormArticle] = useState<Partial<Article>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load articles
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching articles:", error);
    setArticles(data ?? []);
    setLoading(false);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formArticle.title || !formArticle.content) {
      alert("Title and content are required.");
      return;
    }
    setSubmitting(true);

    if (formMode === "create") {
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert([
          {
            title: formArticle.title,
            content: formArticle.content,
            category: formArticle.category || "",
          },
        ]);

      if (error) {
        console.error(error);
        alert("Failed to create article.");
      } else {
        setArticles([...(data ?? []), ...articles]);
        setFormArticle({});
      }
    } else if (formMode === "edit" && formArticle.id) {
      const { data, error } = await supabase
        .from("knowledge_base")
        .update({
          title: formArticle.title,
          content: formArticle.content,
          category: formArticle.category,
        })
        .eq("id", formArticle.id);

      if (error) {
        console.error(error);
        alert("Failed to update article.");
      } else {
        // Update locally
        setArticles(
          articles.map((a) => (a.id === formArticle.id ? { ...a, ...formArticle } as Article : a))
        );
        setFormArticle({});
        setFormMode("create");
      }
    }

    setSubmitting(false);
  };

  // Delete article
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Failed to delete article.");
    } else {
      setArticles(articles.filter((a) => a.id !== id));
      if (selectedArticle?.id === id) setSelectedArticle(null);
    }
  };

  // Filtered articles
  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-4">Loading articles...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Knowledge Base</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search articles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 rounded-md p-2 w-full mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Form */}
      <div className="mb-8 p-4 bg-white shadow rounded-md border">
        <h2 className="text-xl font-semibold mb-3">
          {formMode === "create" ? "Create New Article" : "Edit Article"}
        </h2>

        <input
          type="text"
          placeholder="Title"
          value={formArticle.title || ""}
          onChange={(e) => setFormArticle({ ...formArticle, title: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="text"
          placeholder="Category"
          value={formArticle.category || ""}
          onChange={(e) => setFormArticle({ ...formArticle, category: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <textarea
          placeholder="Content"
          value={formArticle.content || ""}
          onChange={(e) => setFormArticle({ ...formArticle, content: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={5}
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {formMode === "create" ? "Create" : "Update"}
          </button>
          {formMode === "edit" && (
            <button
              onClick={() => {
                setFormArticle({});
                setFormMode("create");
              }}
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="border rounded-md p-4 bg-white shadow hover:shadow-lg transition cursor-pointer relative"
          >
            <h2 className="font-semibold text-lg">{article.title}</h2>
            <p className="text-sm text-gray-500 mb-2">{article.category}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedArticle(article);
                }}
                className="text-blue-500 hover:underline text-sm"
              >
                View
              </button>
              <button
                onClick={() => {
                  setFormMode("edit");
                  setFormArticle(article);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-green-500 hover:underline text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(article.id)}
                className="text-red-500 hover:underline text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full relative">
            <h2 className="text-2xl font-bold mb-4">{selectedArticle.title}</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedArticle.content}</p>
            <p className="text-sm text-gray-500 mb-2">Category: {selectedArticle.category}</p>
            <p className="text-sm text-gray-400">Created at: {new Date(selectedArticle.created_at).toLocaleString()}</p>
            <button
              onClick={() => setSelectedArticle(null)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
