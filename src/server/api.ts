import { Router } from "express";
import { supabaseAdmin } from "../services/supabase";
import { getEmbedding } from "../services/gemini";

const router = Router();

// GET /api/agents - List all active agents
router.get("/agents", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error fetching agents:", err);
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

// POST /api/search - Semantic search with ranking
router.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // 1. Get embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // 2. Perform vector similarity search using RPC (requires pgvector extension and match_agents function)
    // The match_agents function should be defined in Supabase SQL
    const { data: matchedAgents, error } = await supabaseAdmin.rpc("match_agents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Minimum similarity
      match_count: 50,      // Max candidates
    });

    if (error) throw error;

    // 3. Re-rank results based on PRD formula
    // Ranking = (Similarity * 0.4) + (CategoryRelevance * 0.3) + (Recency * 0.2) + (Rating * 0.1)
    const rankedResults = matchedAgents.map((agent: any) => {
      const similarityScore = agent.similarity; // 0 to 1
      
      // Category relevance (placeholder for now, could be based on tag matching)
      const categoryRelevance = 0.8; 

      // Recency score (higher for more recent tests)
      const lastTested = new Date(agent.last_tested_at).getTime();
      const now = new Date().getTime();
      const daysSinceTest = (now - lastTested) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - daysSinceTest / 365); // 1.0 if today, 0 if > 1 year ago

      // User rating (placeholder for MVP)
      const ratingScore = 0.7;

      const finalScore = (similarityScore * 0.4) + (categoryRelevance * 0.3) + (recencyScore * 0.2) + (ratingScore * 0.1);

      return {
        ...agent,
        match_explanation: `Matched based on semantic similarity (${Math.round(similarityScore * 100)}%) and recent test performance.`,
        final_score: finalScore
      };
    });

    // Sort by final score descending
    const sortedResults = rankedResults.sort((a: any, b: any) => b.final_score - a.final_score).slice(0, 20);

    res.json(sortedResults);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// POST /api/submit - Public agent submission
router.post("/submit", async (req, res) => {
  const { name, vendor, tagline, external_url, category_tags, submitter_email } = req.body;

  if (!name || !external_url || !submitter_email) {
    return res.status(400).json({ error: "Name, URL, and Submitter Email are required" });
  }

  try {
    const { error } = await supabaseAdmin.from("submissions").insert({
      name,
      vendor,
      tagline,
      external_url,
      category_tags,
      submitter_email,
      status: "pending"
    });

    if (error) throw error;
    res.json({ success: true, message: "Submission received! Our team will review it shortly." });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({ error: "Failed to submit agent" });
  }
});

export default router;
