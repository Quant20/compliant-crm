import { useMemo, useState } from "react";
import { FaBookOpen, FaFolderOpen, FaSearch } from "react-icons/fa";
import "./KnowledgeBase.css";

const articles = [
  { id: 1, category: "Tickets", title: "Creating and assigning a ticket", summary: "How support agents create tickets, choose priority and assign ownership.", updated: "Recovered guide" },
  { id: 2, category: "Tickets", title: "Closing and reopening complaints", summary: "Recommended steps before closing a customer complaint and how to reopen it.", updated: "Recovered guide" },
  { id: 3, category: "Email", title: "Sending an email from Ticket Details", summary: "Use Reply, Reply All or New Email from a ticket conversation.", updated: "Recovered guide" },
  { id: 4, category: "WhatsApp", title: "Working with WhatsApp Inbox", summary: "Review incoming messages and convert a conversation into a ticket.", updated: "Recovered guide" },
  { id: 5, category: "SLA", title: "Priority and SLA handling", summary: "Understand Critical, High, Medium and Low ticket response expectations.", updated: "Recovered guide" },
  { id: 6, category: "Administration", title: "Agent workload and assignment", summary: "Review agent capacity before assigning customer complaints.", updated: "Recovered guide" },
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const categories = ["All", ...Array.from(new Set(articles.map((article) => article.category)))];

  const filteredArticles = useMemo(() => {
    const query = normalize(searchTerm);
    return articles.filter((article) => {
      const matchesCategory = category === "All" || article.category === category;
      const matchesSearch = !query || [article.title, article.summary, article.category].some((value) => normalize(value).includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [category, searchTerm]);

  return (
    <section className="crm-page-container knowledge-page">
      <div className="knowledge-page__header">
        <div>
          <p className="page-eyebrow">SUPPORT KNOWLEDGE</p>
          <h2>Knowledge Base</h2>
          <p>Recovered operating guides for the ServiceWise support workflow.</p>
        </div>
      </div>

      <div className="knowledge-summary-grid">
        <article><FaBookOpen /><div><span>Articles</span><strong>{articles.length}</strong></div></article>
        <article><FaFolderOpen /><div><span>Categories</span><strong>{categories.length - 1}</strong></div></article>
      </div>

      <div className="knowledge-panel">
        <div className="knowledge-toolbar">
          <label className="knowledge-search"><FaSearch /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search knowledge base" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        </div>

        <div className="knowledge-layout">
          <div className="knowledge-list">
            {filteredArticles.map((article) => (
              <button key={article.id} type="button" className={`knowledge-card${selectedArticle?.id === article.id ? " active" : ""}`} onClick={() => setSelectedArticle(article)}>
                <span>{article.category}</span>
                <strong>{article.title}</strong>
                <p>{article.summary}</p>
                <small>{article.updated}</small>
              </button>
            ))}
            {filteredArticles.length === 0 && <p className="knowledge-empty">No matching articles found.</p>}
          </div>

          <aside className="knowledge-preview">
            {selectedArticle ? (
              <>
                <span>{selectedArticle.category}</span>
                <h3>{selectedArticle.title}</h3>
                <p>{selectedArticle.summary}</p>
                <div className="knowledge-preview__notice">The original article body was not present in the repository. This recovered page preserves the article structure without inventing operational instructions.</div>
              </>
            ) : (
              <div className="knowledge-preview__empty"><FaBookOpen /><h3>Select an article</h3><p>Choose a guide from the list to view its recovered summary.</p></div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
