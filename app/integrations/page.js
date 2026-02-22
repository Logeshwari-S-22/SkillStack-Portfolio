"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const [githubConnected, setGithubConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (code) {
      connectGithub(code);
    }
  }, [code]);

  const connectGithub = async (authCode) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error}`);
        setLoading(false);
        return;
      }

      setGithubConnected(true);
      setMessage(`✅ GitHub connected! Detected ${data.detectedSkills.length} skills: ${data.detectedSkills.join(", ")}`);
      setLoading(false);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleGitHubClick = () => {
    const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/integrations/github/callback`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user,repo`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">🔗 Integrations</h1>
          <p className="text-gray-400">Connect external platforms to auto-detect your skills</p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-lg ${message.startsWith("✅") ? "bg-green-900 border border-green-600 text-green-200" : "bg-red-900 border border-red-600 text-red-200"}`}>
            {message}
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900 border border-red-600 text-red-200">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">🐙</div>
              <div>
                <h3 className="text-2xl font-bold text-white">GitHub</h3>
                <p className="text-gray-400 text-sm">Auto-detect skills from repos</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6">
              Connect your GitHub account to automatically detect programming languages and frameworks you use.
            </p>

            <button
              onClick={handleGitHubClick}
              disabled={loading || githubConnected}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                githubConnected
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-white"
              }`}
            >
              {githubConnected ? "✅ Connected" : loading ? "Connecting..." : "Connect GitHub"}
            </button>
          </div>

          {/* HackerRank - Coming Soon */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 opacity-50">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">⚡</div>
              <div>
                <h3 className="text-2xl font-bold text-white">HackerRank</h3>
                <p className="text-gray-400 text-sm">Coming Soon</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6">
              Connect your HackerRank profile to verify your coding skills through challenges.
            </p>

            <button disabled className="w-full py-3 rounded-lg font-semibold bg-gray-800 text-gray-500">
              Coming Soon
            </button>
          </div>

          {/* LeetCode - Coming Soon */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 opacity-50">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">🔗</div>
              <div>
                <h3 className="text-2xl font-bold text-white">LeetCode</h3>
                <p className="text-gray-400 text-sm">Coming Soon</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6">
              Connect your LeetCode account to showcase your problem-solving expertise.
            </p>

            <button disabled className="w-full py-3 rounded-lg font-semibold bg-gray-800 text-gray-500">
              Coming Soon
            </button>
          </div>

          {/* Coursera - Coming Soon */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 opacity-50">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">🎓</div>
              <div>
                <h3 className="text-2xl font-bold text-white">Coursera</h3>
                <p className="text-gray-400 text-sm">Coming Soon</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6">
              Connect your Coursera account to verify your online course completions.
            </p>

            <button disabled className="w-full py-3 rounded-lg font-semibold bg-gray-800 text-gray-500">
              Coming Soon
            </button>
          </div>
        </div>

        <div className="mt-12 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-xl p-6">
          <p className="text-blue-200">
            ℹ️ <strong>How it works:</strong> When you connect an account, we securely access your public data to detect skills and technologies you use. Your credentials are never stored or shared.
          </p>
        </div>
      </div>
    </div>
  );
}
