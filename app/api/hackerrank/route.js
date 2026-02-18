import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch { return null; }
}

// GET → fetch full HackerRank profile by username
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "HackerRank username required" }, { status: 400 });
    }

    // Fetch HackerRank public profile page
    const profileUrl = `https://www.hackerrank.com/${username}`;
    const res = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "HackerRank user not found. Check the username." }, { status: 404 });
    }

    const html = await res.text();

    // Check if profile exists
    if (html.includes("page_not_found") || html.includes("404")) {
      return NextResponse.json({ error: "HackerRank user not found." }, { status: 404 });
    }

    // ── Parse badges (language stars) ──
    const badges = [];
    // Badge pattern: looks for badge names and star counts in the HTML
    const badgeMatches = html.matchAll(/"badge_name":"([^"]+)","stars":(\d+),"total_star":(\d+)/g);
    for (const match of badgeMatches) {
      badges.push({
        name: match[1],
        stars: parseInt(match[2]),
        totalStars: parseInt(match[3]),
      });
    }

    // Alternative badge parsing if first method fails
    if (badges.length === 0) {
      const altMatches = html.matchAll(/class="[^"]*badge[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]+)<\/[^>]*>[\s\S]*?(\d)\s*star/gi);
      for (const match of altMatches) {
        badges.push({ name: match[1].trim(), stars: parseInt(match[2]), totalStars: 5 });
      }
    }

    // ── Parse certificates ──
    const certificates = [];
    const certMatches = html.matchAll(/"certificate":\s*\{[^}]*"slug":"([^"]+)"[^}]*"certificates":\[([^\]]*)\]/g);
    for (const match of certMatches) {
      certificates.push({ name: match[1].replace(/-/g, " "), slug: match[1] });
    }

    // Alternative certificate parsing
    if (certificates.length === 0) {
      const certAlt = html.matchAll(/hackerrank\.com\/certificates\/([a-zA-Z0-9]+)/g);
      for (const match of certAlt) {
        certificates.push({
          name: match[1],
          slug: match[1],
          verifyUrl: `https://www.hackerrank.com/certificates/${match[1]}`,
        });
      }
    }

    // ── Parse display name ──
    let displayName = username;
    const nameMatch = html.match(/"name":"([^"]+)"/);
    if (nameMatch) displayName = nameMatch[1];

    // ── Parse avatar ──
    let avatar = "";
    const avatarMatch = html.match(/"avatar":"([^"]+)"/);
    if (avatarMatch) avatar = avatarMatch[1];

    // ── Parse country ──
    let country = "";
    const countryMatch = html.match(/"country":"([^"]+)"/);
    if (countryMatch) country = countryMatch[1];

    // ── Parse school ──
    let school = "";
    const schoolMatch = html.match(/"school":"([^"]+)"/);
    if (schoolMatch) school = schoolMatch[1];

    return NextResponse.json({
      username,
      displayName,
      avatar,
      country,
      school,
      profileUrl,
      badges,        // language stars
      certificates,  // earned certs
    });

  } catch (err) {
    console.error("HackerRank fetch error:", err.message);
    return NextResponse.json({ error: "Failed to fetch HackerRank profile." }, { status: 500 });
  }
}

// POST → import selected certificates + auto-create posts
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { certificates, badges, hackerrankUsername } = await req.json();

    if (!certificates?.length && !badges?.length) {
      return NextResponse.json({ error: "Nothing selected to import" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    let imported = 0;
    const posts = [];

    // Import certificates
    for (const cert of (certificates || [])) {
      const exists = user.certifications.find(
        c => c.credentialId === cert.slug
      );
      if (exists) continue;

      const certName = cert.name
        .split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      user.certifications.push({
        title: certName,
        issuer: "HackerRank",
        issueDate: new Date(),
        credentialUrl: cert.verifyUrl || `https://www.hackerrank.com/certificates/${cert.slug}`,
        credentialId: cert.slug,
      });
      user.xp += 30;
      imported++;

      // Auto-create post
      const post = await Post.create({
        userId: decoded.id,
        userName: decoded.name,
        userUsername: decoded.username,
        type: "hackerrank",
        title: `🏅 Earned "${certName}" Certificate on HackerRank!`,
        description: `I just earned the ${certName} certificate on HackerRank. Check it out!`,
        link: cert.verifyUrl || `https://www.hackerrank.com/${hackerrankUsername}`,
        tags: ["HackerRank", "Certificate", certName],
      });
      posts.push(post);
    }

    // Save HackerRank badges as skills
    for (const badge of (badges || [])) {
      const badgeName = `HackerRank ${badge.name}`;
      const exists = user.skills.find(
        s => s.name.toLowerCase() === badgeName.toLowerCase()
      );
      if (exists) continue;

      const level = badge.stars >= 4 ? "Expert" :
                    badge.stars >= 3 ? "Advanced" :
                    badge.stars >= 2 ? "Intermediate" : "Beginner";

      user.skills.push({ name: badgeName, level });
      user.xp += 10;
      imported++;
    }

    await user.save();

    return NextResponse.json({
      message: `Imported ${imported} items! Posts created automatically.`,
      xp: user.xp,
      imported,
    }, { status: 201 });

  } catch (err) {
    console.error("HackerRank import error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}