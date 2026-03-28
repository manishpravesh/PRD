import { supabaseAdmin } from "../../config/supabase.js";
import { HttpError } from "../../utils/http.js";

function normalizeCharityPayload(payload = {}) {
  const name = String(payload.name ?? "").trim();
  if (!name) {
    throw new HttpError(400, "Charity name is required");
  }

  return {
    name,
    description: payload.description
      ? String(payload.description).trim()
      : null,
    website_url: payload.websiteUrl ? String(payload.websiteUrl).trim() : null,
    logo_url: payload.logoUrl ? String(payload.logoUrl).trim() : null,
    banner_url: payload.bannerUrl ? String(payload.bannerUrl).trim() : null,
    country_code: payload.countryCode
      ? String(payload.countryCode).trim().toUpperCase()
      : "IN",
    is_featured: Boolean(payload.isFeatured),
  };
}

export async function listCharities({ query = "", featured = false } = {}) {
  let dbQuery = supabaseAdmin
    .from("charities")
    .select(
      "id, name, description, website_url, logo_url, banner_url, country_code, is_featured, created_at",
    )
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (featured) {
    dbQuery = dbQuery.eq("is_featured", true);
  }

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  const { data, error } = await dbQuery;
  if (error) {
    throw new Error(`Unable to list charities: ${error.message}`);
  }

  return data;
}

export async function getCharityById(charityId) {
  const { data, error } = await supabaseAdmin
    .from("charities")
    .select(
      "id, name, description, website_url, logo_url, banner_url, country_code, is_featured, created_at, updated_at",
    )
    .eq("id", charityId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch charity: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, "Charity not found");
  }

  return data;
}

export async function createCharity(payload) {
  const normalized = normalizeCharityPayload(payload);
  const { data, error } = await supabaseAdmin
    .from("charities")
    .insert(normalized)
    .select(
      "id, name, description, website_url, logo_url, banner_url, country_code, is_featured",
    )
    .single();

  if (error) {
    throw new Error(`Unable to create charity: ${error.message}`);
  }

  return data;
}

export async function updateCharity(charityId, payload) {
  const current = await getCharityById(charityId);
  const partial = {
    name: payload.name ?? current.name,
    description: payload.description ?? current.description,
    websiteUrl: payload.websiteUrl ?? current.website_url,
    logoUrl: payload.logoUrl ?? current.logo_url,
    bannerUrl: payload.bannerUrl ?? current.banner_url,
    countryCode: payload.countryCode ?? current.country_code,
    isFeatured: payload.isFeatured ?? current.is_featured,
  };

  const normalized = normalizeCharityPayload(partial);
  const { data, error } = await supabaseAdmin
    .from("charities")
    .update(normalized)
    .eq("id", charityId)
    .select(
      "id, name, description, website_url, logo_url, banner_url, country_code, is_featured",
    )
    .single();

  if (error) {
    throw new Error(`Unable to update charity: ${error.message}`);
  }

  return data;
}

export async function deleteCharity(charityId) {
  const { error } = await supabaseAdmin
    .from("charities")
    .delete()
    .eq("id", charityId);
  if (error) {
    throw new Error(`Unable to delete charity: ${error.message}`);
  }
}

export async function getMyCharityPreference(profileId) {
  const { data, error } = await supabaseAdmin
    .from("user_charity_preferences")
    .select(
      "id, user_id, charity_id, contribution_percent, is_primary, charities(id, name, description, country_code)",
    )
    .eq("user_id", profileId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch charity preference: ${error.message}`);
  }

  return data;
}

export async function updateMyCharityPreference(profileId, payload = {}) {
  const charityId = String(payload.charityId ?? "").trim();
  const contributionPercent = Number(payload.contributionPercent ?? 10);

  if (!charityId) {
    throw new HttpError(400, "charityId is required");
  }

  if (
    Number.isNaN(contributionPercent) ||
    contributionPercent < 10 ||
    contributionPercent > 100
  ) {
    throw new HttpError(400, "contributionPercent must be between 10 and 100");
  }

  const { data: charity, error: charityError } = await supabaseAdmin
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .maybeSingle();

  if (charityError) {
    throw new Error(`Unable to validate charity: ${charityError.message}`);
  }

  if (!charity) {
    throw new HttpError(404, "Selected charity not found");
  }

  await supabaseAdmin
    .from("user_charity_preferences")
    .update({ is_primary: false })
    .eq("user_id", profileId)
    .eq("is_primary", true);

  const { data, error } = await supabaseAdmin
    .from("user_charity_preferences")
    .upsert(
      {
        user_id: profileId,
        charity_id: charityId,
        contribution_percent: contributionPercent,
        is_primary: true,
      },
      { onConflict: "user_id,charity_id" },
    )
    .select("id, user_id, charity_id, contribution_percent, is_primary")
    .single();

  if (error) {
    throw new Error(`Unable to update charity preference: ${error.message}`);
  }

  return data;
}

export async function listMyIndependentDonations(profileId) {
  const { data, error } = await supabaseAdmin
    .from("independent_donations")
    .select("id, user_id, charity_id, amount_inr, status, created_at")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch donations: ${error.message}`);
  }

  return data;
}

export async function createIndependentDonation(profileId, payload = {}) {
  const charityId = String(payload.charityId ?? "").trim();
  const amountInr = Number(payload.amountInr ?? 0);

  if (!charityId) {
    throw new HttpError(400, "charityId is required");
  }

  if (!Number.isInteger(amountInr) || amountInr <= 0) {
    throw new HttpError(400, "amountInr must be a positive integer");
  }

  const { data: charity, error: charityError } = await supabaseAdmin
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .maybeSingle();

  if (charityError) {
    throw new Error(`Unable to validate charity: ${charityError.message}`);
  }

  if (!charity) {
    throw new HttpError(404, "Selected charity not found");
  }

  const { data, error } = await supabaseAdmin
    .from("independent_donations")
    .insert({
      user_id: profileId,
      charity_id: charityId,
      amount_inr: amountInr,
      status: "pending",
    })
    .select("id, user_id, charity_id, amount_inr, status, created_at")
    .single();

  if (error) {
    throw new Error(`Unable to create donation: ${error.message}`);
  }

  return data;
}
