"use client";
import { useState } from "react";

export default function TestAssessment() {
  const [skill, setSkill] = useState("JavaScript");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [type, setType] = useState("mcq");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchQuestions = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/assessment?skill=${skill}&difficulty=${difficulty}&type=${type}`);
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
        <h1 className="text-3xl font-bold mb-6">🧪 Test Assessment API</h1>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Skill</label>
              <input
                value={skill}
                onChange={e => setSkill(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="e.g. JavaScript, Python, React"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="mcq">MCQ Questions</option>
                <option value="code">Code Challenge</option>
              </select>
            </div>

            <button
              onClick={fetchQuestions}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Questions"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded-xl mb-4">
            <p className="font-semibold mb-1">❌ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-900 border border-green-600 rounded-xl p-6">
            <p className="text-green-400 font-semibold mb-4">✅ Success! Generated {type === "mcq" ? "MCQ" : "Code Challenge"}</p>
            <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}