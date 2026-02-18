"use client";
import { useState } from "react";

export default function TestHackerRank() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/hackerrank?username=${username}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to fetch");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Test HackerRank API</h1>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">HackerRank Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchProfile()}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="e.g. johnsmith123"
              />
              <p className="text-xs text-gray-500 mt-1">
                Try a known HackerRank user like: <code className="text-violet-400">tourist</code> or <code className="text-violet-400">errichto</code>
              </p>
            </div>

            <button
              onClick={fetchProfile}
              disabled={loading || !username}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Fetching..." : "Fetch HackerRank Profile"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded-xl mb-4">
            <p className="font-semibold mb-1">❌ Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs text-gray-400 mt-2">
              This could mean: (1) username doesn't exist, (2) HackerRank profile is private, or (3) HackerRank changed their HTML structure
            </p>
          </div>
        )}

        {result && (
          <div className="bg-gray-900 border border-green-600 rounded-xl p-6">
            <p className="text-green-400 font-semibold mb-4">✅ Success! Found HackerRank Profile</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Display Name</p>
                <p className="font-semibold">{result.displayName || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Badges ({result.badges?.length || 0})</p>
                {result.badges?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {result.badges.map((b, i) => (
                      <div key={i} className="bg-gray-800 p-3 rounded-lg">
                        <p className="font-semibold text-sm">{b.name}</p>
                        <p className="text-xs text-yellow-400">⭐ {b.stars}/{b.totalStars} stars</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No badges found</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-400">Certificates ({result.certificates?.length || 0})</p>
                {result.certificates?.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {result.certificates.map((c, i) => (
                      <div key={i} className="bg-gray-800 p-3 rounded-lg">
                        <p className="font-semibold text-sm">{c.name}</p>
                        {c.verifyUrl && (
                          <a href={c.verifyUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline">
                            🔗 Verify
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No certificates found</p>
                )}
              </div>

              <details className="bg-gray-800 p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-semibold">📋 Full JSON Response</summary>
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}