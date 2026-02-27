"use client";
import { useState } from "react";

export default function TestGemini() {
  const [prompt, setPrompt] = useState("Say hello and tell me what 2+2 equals");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const testAPI = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/test-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setResult(data.response);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Test Gemini API</h1>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium mb-2">Test Prompt</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white h-24 resize-none"
            placeholder="Type a test prompt..."
          />
          <button
            onClick={testAPI}
            disabled={loading}
            className="mt-3 w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Gemini API"}
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded-xl">
            <p className="font-semibold">❌ Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-900 border border-green-600 text-green-200 p-4 rounded-xl">
            <p className="font-semibold mb-2">✅ Gemini Response:</p>
            <p className="text-sm whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}