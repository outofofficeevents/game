import { Router, type IRouter } from "express";
import { db, scoresTable, insertScoreSchema } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/scores", async (req, res) => {
  const parsed = insertScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [row] = await db
    .insert(scoresTable)
    .values(parsed.data)
    .returning();
  res.status(201).json({
    id: row.id,
    playerName: row.playerName,
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/scores/leaderboard", async (_req, res) => {
  const rows = await db
    .select()
    .from(scoresTable)
    .orderBy(desc(scoresTable.score))
    .limit(10);
  res.json({
    entries: rows.map((r) => ({
      id: r.id,
      playerName: r.playerName,
      score: r.score,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

export default router;
