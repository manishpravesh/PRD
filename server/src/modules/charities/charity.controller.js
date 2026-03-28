import { asyncHandler } from "../../utils/http.js";
import {
  createCharity,
  deleteCharity,
  getCharityById,
  listCharities,
  updateCharity,
} from "./charity.service.js";

export const getCharities = asyncHandler(async (req, res) => {
  const charities = await listCharities({
    query: String(req.query.q ?? ""),
    featured: String(req.query.featured ?? "false") === "true",
  });

  res.status(200).json({ ok: true, data: charities });
});

export const getCharity = asyncHandler(async (req, res) => {
  const charity = await getCharityById(req.params.charityId);
  res.status(200).json({ ok: true, data: charity });
});

export const postCharity = asyncHandler(async (req, res) => {
  const created = await createCharity(req.body ?? {});
  res.status(201).json({ ok: true, data: created });
});

export const putCharity = asyncHandler(async (req, res) => {
  const updated = await updateCharity(req.params.charityId, req.body ?? {});
  res.status(200).json({ ok: true, data: updated });
});

export const removeCharity = asyncHandler(async (req, res) => {
  await deleteCharity(req.params.charityId);
  res.status(200).json({ ok: true, message: "Charity deleted" });
});
