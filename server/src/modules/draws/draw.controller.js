import { asyncHandler } from "../../utils/http.js";
import {
  createDraw,
  listDraws,
  publishDraw,
  runDrawSimulation,
} from "./draw.service.js";

export const getPublishedDraws = asyncHandler(async (_req, res) => {
  const draws = await listDraws({ includeDraft: false, forAdmin: false });
  res.status(200).json({ ok: true, data: draws });
});

export const getAllDrawsAdmin = asyncHandler(async (_req, res) => {
  const draws = await listDraws({ includeDraft: true, forAdmin: true });
  res.status(200).json({ ok: true, data: draws });
});

export const postDraw = asyncHandler(async (req, res) => {
  const draw = await createDraw({
    drawMonth: req.body?.drawMonth,
    mode: req.body?.mode,
    createdBy: req.auth.profile.id,
  });

  res.status(201).json({ ok: true, data: draw });
});

export const simulateDraw = asyncHandler(async (req, res) => {
  const result = await runDrawSimulation(req.params.drawId, req.auth.profile.id);
  res.status(200).json({ ok: true, data: result });
});

export const publishDrawController = asyncHandler(async (req, res) => {
  const result = await publishDraw(req.params.drawId, req.auth.profile.id);
  res.status(200).json({ ok: true, data: result });
});
