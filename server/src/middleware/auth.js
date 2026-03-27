import { getProfileByAuthUserId, supabaseAnon } from "../config/supabase.js";
import { HttpError } from "../utils/http.js";

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return token ?? null;
}

export async function authenticate(req, _res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new HttpError(401, "Missing Bearer token"));
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data?.user) {
    return next(new HttpError(401, "Invalid or expired token"));
  }

  const profile = await getProfileByAuthUserId(data.user.id);
  if (!profile) {
    return next(new HttpError(403, "Profile not found for authenticated user"));
  }

  req.auth = {
    token,
    user: data.user,
    profile,
  };

  next();
}

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    const role = req.auth?.profile?.role;
    if (!role || !allowedRoles.includes(role)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }

    next();
  };
}
