// src/components/knowledgebase/KnowledgeBase.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Layout from "../technician/Layout"; // import the Layout component

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  category: string;
  status: "draft" | "published" | "archived";
  author_id: string;
  views?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  related_tickets?: number;
  tags?: string[];
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

interface KnowledgeBaseProps {
  currentUser: { id: string; name: string; email: string; role: string };
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ currentUser }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState([
    "software",
    "hardware",
    "network",
    "process",
    "general",
  ]);

  // Form state
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formArticle, setFormArticle] = useState<Partial<Article>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("knowledge_base_articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles:", error);
      alert("Failed to load articles. Please try again.");
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formArticle.title || !formArticle.content || !formArticle.category) {
      alert("Title, content, and category are required.");
      return;
    }
    setSubmitting(true);

    const user = await supabase.auth.getUser();
    const author_id = user.data.user?.id;
    if (!author_id) {
      alert("You must be logged in to create or edit articles.");
      setSubmitting(false);
      return;
    }

    try {
      if (formMode === "create") {
        const { data, error } = await supabase
          .from("knowledge_base_articles")
          .insert([
            {
              title: formArticle.title,
              content: formArticle.content,
              category: formArticle.category,
              status: "draft",
              author_id,
            },
          ])
          .select();

        if (error) throw error;
        setArticles([...(data || []), ...articles]);
        resetForm();
        alert("Article created successfully!");
      } else if (formMode === "edit" && formArticle.id) {
        const { data, error } = await supabase
          .from("knowledge_base_articles")
          .update({
            title: formArticle.title,
            content: formArticle.content,
            category: formArticle.category,
            status: formArticle.status,
          })
          .eq("id", formArticle.id)
          .select();

        if (error) throw error;

        setArticles(
          articles.map((a) =>
            a.id === formArticle.id ? { ...a, ...formArticle } as Article : a
          )
        );
        resetForm();
        alert("Article updated successfully!");
      }
    } catch (error) {
      console.error(error);
      alert(`Failed to ${formMode} article.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase.from("knowledge_base_articles").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Failed to delete article.");
    } else {
      setArticles(articles.filter((a) => a.id !== id));
      if (selectedArticle?.id === id) setSelectedArticle(null);
      alert("Article deleted successfully.");
    }
  };

  const resetForm = () => {
    setFormArticle({});
    setFormMode("create");
    setShowForm(false);
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.content.toLowerCase().includes(search.toLowerCase()) ||
      article.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = activeTab === "all" || article.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Layout currentUser={currentUser} title="Knowledge Base">
      {/* Search & New Article */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow px-4 py-2 border rounded-lg"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          {showForm ? "Close" : "New Article"}
        </button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-full ${activeTab === "all" ? "bg-blue-100" : "bg-gray-200"}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`px-4 py-2 rounded-full ${activeTab === c ? "bg-blue-100" : "bg-gray-200"}`}
            onClick={() => setActiveTab(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">{formMode === "create" ? "Create Article" : "Edit Article"}</h2>
          <input
            type="text"
            placeholder="Title"
            value={formArticle.title || ""}
            onChange={(e) => setFormArticle({ ...formArticle, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-4"
          />
          <select
            value={formArticle.category || ""}
            onChange={(e) => setFormArticle({ ...formArticle, category: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-4"
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            placeholder="Content"
            value={formArticle.content || ""}
            onChange={(e) => setFormArticle({ ...formArticle, content: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg mb-4"
            rows={6}
          />
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              {submitting ? "Processing..." : formMode === "create" ? "Create" : "Update"}
            </button>
            <button onClick={resetForm} className="bg-gray-200 px-6 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div key={article.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium bg-blue-100 px-2 py-1 rounded-full">{article.category}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setFormMode("edit"); setFormArticle(article); setShowForm(true); window.scrollTo(0,0); }}
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(article.id)} className="text-red-600">Delete</button>
              </div>
            </div>
            <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
            <p className="text-gray-600 line-clamp-3">{article.content}</p>
            <button onClick={() => setSelectedArticle(article)} className="text-blue-600 mt-2">Read More</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedArticle.title}</h2>
              <button onClick={() => setSelectedArticle(null)}>Close</button>
            </div>
            <span className="inline-block text-xs bg-blue-100 px-2 py-1 rounded-full mb-2">{selectedArticle.category}</span>
            <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default KnowledgeBase;
