"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function VerifyCredential() {
  const params = useParams();
  const id = params.id;

  const [credential, setCredential] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const res = await fetch(`/api/credentials/verify?id=${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Credential not found");
          setLoading(false);
          return;
        }

        setCredential(data.credential);
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        setError("Error loading credential: " + err.message);
        setLoading(false);
      }
    };

    fetchCredential();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying credential...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-red-900 border border-red-600 rounded-xl p-8 max-w-md">
          <p className="text-red-200 text-center"><strong>❌ Verification Failed</strong></p>
          <p className="text-red-300 text-center mt-4">{error}</p>
        </div>
      </div>
    );
  }

  const getLevelColor = (level) => {
    switch (level) {
      case "Expert":
        return "from-red-600 to-red-700";
      case "Advanced":
        return "from-orange-600 to-orange-700";
      case "Intermediate":
        return "from-purple-600 to-purple-700";
      case "Beginner":
        return "from-blue-600 to-blue-700";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">✅ Credential Verified</h1>
          <p className="text-gray-400">This credential is authentic and verified</p>
        </div>

        <div className={`bg-gradient-to-br ${getLevelColor(credential?.level)} rounded-2xl p-1 mb-8`}>
          <div className="bg-gray-900 rounded-2xl p-12">
            <div className="text-center mb-8">
              <p className="text-6xl mb-4">🏆</p>
              <h2 className="text-4xl font-bold text-white">{credential?.skill}</h2>
              <p className={`text-2xl font-bold mt-2 ${credential?.level === "Expert" ? "text-red-400" : credential?.level === "Advanced" ? "text-orange-400" : credential?.level === "Intermediate" ? "text-purple-400" : "text-blue-400"}`}>
                {credential?.level}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-t border-gray-700 pt-8">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Score</p>
                <p className="text-3xl font-bold text-green-400">{credential?.score}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Assessment Type</p>
                <p className="text-xl font-bold text-white">{credential?.assessmentType === "mcq" ? "MCQ" : "Code"}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Issued Date</p>
                <p className="text-xl font-bold text-white">{new Date(credential?.issueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-8">
              <p className="text-gray-400 text-xs mb-2">Credential ID</p>
              <p className="text-gray-300 font-mono text-sm break-all">{credential?.credentialId}</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Earned By</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{user.name?.charAt(0) || "U"}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{user.name}</p>
                <p className="text-gray-400">{user.email}</p>
                {user.headline && <p className="text-gray-300 mt-2">{user.headline}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-xl p-6">
          <p className="text-blue-200">
            ℹ️ <strong>Verification Info:</strong> This credential can be shared and verified by anyone at this link. It represents successful completion of a skill assessment with the score shown above.
          </p>
        </div>
      </div>
    </div>
  );
}