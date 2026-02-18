"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPE_STYLES = {
  manual:        { bg: "bg-violet-100 dark:bg-violet-900", text: "text-violet-700 dark:text-violet-300", label: "📝 Post" },
  github:        { bg: "bg-blue-100 dark:bg-blue-900",     text: "text-blue-700 dark:text-blue-300",     label: "🐙 GitHub" },
  hackerrank:    { bg: "bg-green-100 dark:bg-green-900",   text: "text-green-700 dark:text-green-300",   label: "🏅 HackerRank" },
  certification: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300", label: "🎓 Certificate" },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Avatar component — shows initial letter with gradient
function Avatar({ name = "?", size = "md", src = "" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-xl" };
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-pink-500 to-rose-600",
    "from-green-500 to-emerald-600",
    "from-orange-500 to-amber-600",
    "from-indigo-500 to-blue-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-gray-700 shadow`} />;
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white shadow shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [sharing, setSharing] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [dark, setDark] = useState(true);

  // Create post
  const [showCreate, setShowCreate] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", description: "", link: "" });
  const [posting, setPosting] = useState(false);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setDark(savedTheme === "dark");
    fetchFeed(1, "all");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const fetchFeed = async (pg = 1, type = filter) => {
    if (pg === 1) setLoading(true);
    try {
      const res = await fetch(`/api/posts/feed?page=${pg}&type=${type}`);
      const data = await res.json();
      setPosts(pg === 1 ? (data.posts || []) : prev => [...prev, ...(data.posts || [])]);
      setHasMore(data.hasMore || false);
      setPage(pg);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFilter = (type) => { setFilter(type); fetchFeed(1, type); };

  const handleShare = async (postId) => {
    if (!user) { router.push("/login"); return; }
    setSharing(postId);
    const res = await fetch("/api/posts/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();
    if (res.ok) { showMsg("success", "Shared to your profile! 🔁"); fetchFeed(1, filter); }
    else showMsg("error", data.error);
    setSharing(null);
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) return;
    setPosting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...postForm, type: "manual" }),
    });
    const data = await res.json();
    if (res.ok) {
      setPostForm({ title: "", description: "", link: "" });
      setShowCreate(false);
      showMsg("success", "Post published! 🎉");
      fetchFeed(1, filter);
    } else showMsg("error", data.error);
    setPosting(false);
  };

  const deletePost = async (postId) => {
    await fetch("/api/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    setPosts(prev => prev.filter(p => p._id !== postId));
    showMsg("success", "Post deleted");
  };

  const th = {
    page:    dark ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900",
    nav:     dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    card:    dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    input:   dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500",
    subtext: dark ? "text-gray-400" : "text-gray-500",
    divider: dark ? "border-gray-800" : "border-gray-100",
    btn:     dark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600",
    filterActive: "bg-violet-600 text-white",
    filterInactive: dark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${th.page}`}>

      {/* Navbar */}
      <nav className={`border-b ${th.nav} px-4 py-3 sticky top-0 z-20 shadow-sm`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/feed" className="text-xl font-black bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent shrink-0">
            SkillStack<span className="text-violet-400">TN</span>
          </Link>

          {/* Search bar */}
          <div className={`hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-full px-4 py-2 text-sm ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <span>Search skills, people...</span>
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard" className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${th.btn}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
                <Link href={`/portfolio/${user.username}`} className="flex items-center gap-2">
                  <Avatar name={user.name} size="sm" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${th.btn}`}>Sign in</Link>
                <Link href="/register" className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Join now</Link>
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setDark(!dark)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-colors ${th.btn}`}
              title="Toggle theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </nav>

      {/* Toast */}
      {msg.text && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Left Sidebar — Profile Card */}
        <aside className="lg:col-span-1 space-y-4">
          {user ? (
            <div className={`border rounded-2xl overflow-hidden shadow-sm ${th.card}`}>
              {/* Cover */}
              <div className="h-16 bg-gradient-to-r from-violet-500 to-pink-500" />
              {/* Avatar */}
              <div className="px-4 pb-4">
                <div className="-mt-7 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xl font-black text-white border-4 border-white dark:border-gray-900 shadow-lg">
                    {user.name[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="font-bold text-base">{user.name}</div>
                <div className={`text-xs ${th.subtext}`}>@{user.username}</div>
                <div className={`text-xs mt-2 pt-2 border-t ${th.divider} ${th.subtext}`}>
                  Building skills · SkillStackTN
                </div>
                <Link href="/dashboard" className="mt-3 block w-full text-center bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg font-semibold transition-colors">
                  My Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className={`border rounded-2xl p-5 shadow-sm text-center ${th.card}`}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl mx-auto mb-3">👤</div>
              <p className="font-semibold text-sm mb-1">Join SkillStackTN</p>
              <p className={`text-xs ${th.subtext} mb-4`}>Build and showcase your tech skills</p>
              <Link href="/register" className="block w-full bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg font-semibold transition-colors mb-2">
                Join now
              </Link>
              <Link href="/login" className={`block w-full text-sm py-2 rounded-lg font-semibold transition-colors border ${dark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                Sign in
              </Link>
            </div>
          )}

          {/* Filter Card */}
          <div className={`border rounded-2xl p-4 shadow-sm ${th.card}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${th.subtext}`}>Filter Feed</p>
            <div className="space-y-1">
              {[
                { key: "all", label: "🌍 All Posts" },
                { key: "manual", label: "📝 Posts" },
                { key: "github", label: "🐙 GitHub" },
                { key: "hackerrank", label: "🏅 HackerRank" },
                { key: "certification", label: "🎓 Certificates" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => handleFilter(f.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? "bg-violet-600 text-white" : th.btn}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="lg:col-span-3 space-y-4">

          {/* Create Post Box */}
          {user && (
            <div className={`border rounded-2xl p-4 shadow-sm ${th.card}`}>
              {!showCreate ? (
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} size="md" />
                  <button
                    onClick={() => setShowCreate(true)}
                    className={`flex-1 text-left rounded-full border px-4 py-2.5 text-sm transition-colors ${dark ? "border-gray-700 text-gray-500 hover:bg-gray-800" : "border-gray-300 text-gray-400 hover:bg-gray-50"}`}
                  >
                    Share an achievement, project or update...
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={user.name} size="md" />
                    <div>
                      <div className="font-semibold text-sm">{user.name}</div>
                      <div className={`text-xs ${th.subtext}`}>Post to feed</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${th.input}`}
                      placeholder="What's your achievement? e.g. 'Just built a full-stack app!'"
                      value={postForm.title}
                      onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                    />
                    <textarea
                      className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors resize-none h-24 ${th.input}`}
                      placeholder="Tell your story in detail — what you built, learned, or earned..."
                      value={postForm.description}
                      onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                    />
                    <input
                      className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${th.input}`}
                      placeholder="🔗 Add a link (GitHub, demo, certificate URL)"
                      value={postForm.link}
                      onChange={e => setPostForm({ ...postForm, link: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setShowCreate(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${th.btn}`}>
                        Cancel
                      </button>
                      <button
                        onClick={handleCreatePost}
                        disabled={posting || !postForm.title.trim()}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                      >
                        {posting ? "Publishing..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feed Posts */}
          {loading && posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`text-sm ${th.subtext}`}>Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className={`border rounded-2xl p-16 text-center shadow-sm ${th.card}`}>
              <div className="text-5xl mb-4">📭</div>
              <p className="font-semibold mb-2">No posts yet</p>
              <p className={`text-sm ${th.subtext} mb-5`}>Be the first to share an achievement!</p>
              {!user && (
                <Link href="/register" className="inline-block bg-violet-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors">
                  Join SkillStackTN
                </Link>
              )}
            </div>
          ) : (
            posts.map((post, i) => {
              const typeInfo = TYPE_STYLES[post.type] || TYPE_STYLES.manual;
              const isOwner = user?.id === post.userId?.toString();
              const hasShared = post.shares?.some(s => s.userId?.toString() === user?.id);

              return (
                <div key={i} className={`border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${th.card}`}>
                  {/* Post Header */}
                  <div className="p-5 pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar name={post.userName || "?"} size="md" />
                        <div>
                          <Link href={`/portfolio/${post.userUsername}`} className="font-semibold text-sm hover:text-violet-500 transition-colors">
                            {post.userName}
                          </Link>
                          <div className={`text-xs ${th.subtext}`}>@{post.userUsername}</div>
                          <div className={`text-xs ${th.subtext} mt-0.5`}>{timeAgo(post.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                          {typeInfo.label}
                        </span>
                        {isOwner && (
                          <button onClick={() => deletePost(post._id)} className={`text-xs px-2 py-1 rounded-lg transition-colors hover:text-red-400 ${th.subtext}`}>
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Body */}
                  <div className="px-5 py-4">
                    <h3 className="font-bold text-base mb-1 leading-snug">{post.title}</h3>
                    {post.description && (
                      <p className={`text-sm leading-relaxed ${th.subtext}`}>{post.description}</p>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.map((tag, ti) => (
                          <span key={ti} className={`text-xs px-2.5 py-1 rounded-full font-medium ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Link preview card */}
                    {post.link && (
                      <a href={post.link} target="_blank" rel="noreferrer"
                        className={`mt-3 flex items-center gap-2 border rounded-xl px-4 py-3 text-sm transition-colors group ${dark ? "border-gray-700 hover:border-violet-600 hover:bg-gray-800" : "border-gray-200 hover:border-violet-400 hover:bg-gray-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs shrink-0">
                          🔗
                        </div>
                        <span className="text-violet-500 group-hover:text-violet-400 truncate text-xs font-medium">{post.link}</span>
                      </a>
                    )}
                  </div>

                  {/* Shares count */}
                  {post.shares?.length > 0 && (
                    <div className={`px-5 pb-2 text-xs ${th.subtext}`}>
                      🔁 {post.shares.length} {post.shares.length === 1 ? "person shared" : "people shared"} this
                    </div>
                  )}

                  {/* Divider */}
                  <div className={`mx-5 border-t ${th.divider}`} />

                  {/* Action Bar */}
                  <div className="px-5 py-3 flex items-center gap-2">
                    {!isOwner && user && (
                      <button
                        onClick={() => handleShare(post._id)}
                        disabled={sharing === post._id || hasShared}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasShared ? `${dark ? "text-violet-400" : "text-violet-600"} cursor-default` : th.btn}`}
                      >
                        <span>🔁</span>
                        <span>{sharing === post._id ? "Sharing..." : hasShared ? "Shared" : "Share"}</span>
                      </button>
                    )}
                    <Link
                      href={`/portfolio/${post.userUsername}`}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${th.btn}`}
                    >
                      <span>👤</span>
                      <span>View Profile</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() => fetchFeed(page + 1, filter)}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors border ${dark ? "border-gray-800 hover:bg-gray-800 text-gray-400" : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}
            >
              Load more posts...
            </button>
          )}
        </main>
      </div>
    </div>
  );
}