import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    // Step 1: Check if GitHub user exists
    const userRes = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // No token needed for public repos (60 requests/hour free)
        },
        next: { revalidate: 60 }, // cache for 60 seconds
      }
    );

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "GitHub user not found. Check the username." },
        { status: 404 }
      );
    }

    const githubUser = await userRes.json();

    // Step 2: Fetch all public repositories (up to 100)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100&type=public`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 60 },
      }
    );

    const repos = await reposRes.json();

    // Step 3: Format only what we need
    const formatted = repos
      .filter(r => !r.fork) // exclude forked repos
      .map(r => ({
        id: r.id,
        title: r.name,
        description: r.description || "No description provided",
        techStack: r.language ? [r.language] : [],
        githubUrl: r.html_url,
        demoUrl: r.homepage || "",
        stars: r.stargazers_count,
        forks: r.forks_count,
        updatedAt: r.updated_at,
        topics: r.topics || [],
      }));

    return NextResponse.json({
      user: {
        name: githubUser.name || username,
        avatar: githubUser.avatar_url,
        bio: githubUser.bio || "",
        publicRepos: githubUser.public_repos,
      },
      repos: formatted,
    });

  } catch (error) {
    console.error("GitHub API error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch from GitHub. Try again." },
      { status: 500 }
    );
  }
}