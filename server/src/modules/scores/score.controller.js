import { asyncHandler } from "../../utils/http.js";
import { createScore, listLatestScores, updateScore } from "./score.service.js";

export const getLatestScores = asyncHandler(async (req, res) => {
  const scores = await listLatestScores(req.auth.profile.id, 5);

  res.status(200).json({
    ok: true,
    data: {
      scores,
      total: scores.length,
    },
  });
});

export const addScore = asyncHandler(async (req, res) => {
  const score = await createScore(req.auth.profile.id, req.body ?? {});
  const latestScores = await listLatestScores(req.auth.profile.id, 5);

  res.status(201).json({
    ok: true,
    data: {
      created: score,
      latestScores,
    },
  });
});

export const editScore = asyncHandler(async (req, res) => {
  const updated = await updateScore(
    req.auth.profile.id,
    req.params.scoreId,
    req.body ?? {},
  );
  const latestScores = await listLatestScores(req.auth.profile.id, 5);

  res.status(200).json({
    ok: true,
    data: {
      updated,
      latestScores,
    },
  });
});
