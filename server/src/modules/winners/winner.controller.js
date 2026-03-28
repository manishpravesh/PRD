import { asyncHandler } from "../../utils/http.js";
import {
  listAllWinners,
  listMyWinners,
  reviewWinner,
  uploadWinnerProof,
} from "./winner.service.js";

export const getMyWinners = asyncHandler(async (req, res) => {
  const records = await listMyWinners(req.auth.profile.id);
  res.status(200).json({ ok: true, data: records });
});

export const putMyWinnerProof = asyncHandler(async (req, res) => {
  const updated = await uploadWinnerProof(
    req.auth.profile.id,
    req.params.winnerId,
    req.body?.proofFilePath,
  );

  res.status(200).json({ ok: true, data: updated });
});

export const getAllWinnersAdmin = asyncHandler(async (_req, res) => {
  const records = await listAllWinners();
  res.status(200).json({ ok: true, data: records });
});

export const reviewWinnerAdmin = asyncHandler(async (req, res) => {
  const updated = await reviewWinner({
    winnerId: req.params.winnerId,
    action: req.body?.action,
    rejectionReason: req.body?.rejectionReason,
    adminProfileId: req.auth.profile.id,
  });

  res.status(200).json({ ok: true, data: updated });
});
