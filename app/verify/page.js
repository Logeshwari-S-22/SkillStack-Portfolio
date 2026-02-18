"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const { id } = useParams();
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/credentials?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.credential) setCredential(d.credential);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const LEVEL_COLORS = {
    Beginner:     { bg: "from-green-500 to-emerald-600",   text: "text-green-400" },
    Intermediate: { bg: "from-blue-500 to-cyan-600",       text: "text-blue-400" },
    Advanced:     { bg: "from-violet-500 to-purple-600",   text: "text-violet-400" },
    Expert:       { bg: "from-orange-500 to-amber-600",    text: "text-orange-400" },
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-2">Credential Not Found</h1>
        <p className="text-gray-400 mb-6">This credential ID does not exist or has been revoked.</p>
        <Link href="/" className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold">
          Go to SkillVault
        </Link>
      </div>
    </div>
  );

  const colors = LEVEL_COLORS[credential.level] || LEVEL_COLORS.Beginner;
  const isExpired = new Date(credential.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-black bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
            SkillVault
          </Link>
          <p className="text-gray-400 text-sm mt-1">Credential Verification</p>
        </div>

        {/* Credential Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl">

          {/* Top gradient bar */}
          <div className={`h-3 bg-gradient-to-r ${colors.bg}`} />

          <div className="p-8">
            {/* Verified badge */}
            <div className="flex justify-center mb-6">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-xl`}>
                <span className="text-4xl">🏅</span>
              </div>
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              {isExpired ? (
                <span className="bg-red-900 text-red-300 text-sm px-4 py-1.5 rounded-full font-semibold">
                  ⚠️ Expired
                </span>
              ) : (
                <span className="bg-green-900 text-green-300 text-sm px-4 py-1.5 rounded-full font-semibold">
                  ✅ SkillVault Verified
                </span>
              )}
              {!credential.isClean && (
                <span className="ml-2 bg-yellow-900 text-yellow-300 text-xs px-3 py-1 rounded-full">
                  ⚠️ Flagged
                </span>
              )}
            </div>

            {/* Skill + Level */}
            <h1 className="text-3xl font-black text-center mb-1">{credential.skill}</h1>
            <p className={`text-xl font-bold text-center mb-6 ${colors.text}`}>
              {credential.level} Level
            </p>

            {/* Score bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Assessment Score</span>
                <span className="text-white font-bold">{credential.score}/100</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${colors.bg} transition-all duration-1000`}
                  style={{ width: `${credential.score}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 bg-gray-800 rounded-2xl p-4">
              {[
                { label: "Issued To", value: credential.userName },
                { label: "Username", value: `@${credential.userUsername}` },
                { label: "Credential ID", value: credential.credentialId?.slice(0, 18) + "..." },
                { label: "Issued On", value: new Date(credential.issuedAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) },
                { label: "Valid Until", value: new Date(credential.expiresAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className="text-white text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p className="text-center text-gray-500 text-xs mt-6">
              This credential was issued by SkillVault after successful completion of a proctored skill assessment.
            </p>
          </div>
        </div>

        {/* View Profile */}
        <div className="text-center mt-4">
          <Link
            href={`/portfolio/${credential.userUsername}`}
            className="text-violet-400 hover:text-violet-300 text-sm hover:underline"
          >
            View {credential.userName}'s full profile →
          </Link>
        </div>
      </div>
    </div>
  );
}