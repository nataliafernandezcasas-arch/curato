// PassKit.com REST API wrapper for Midi Pass.
// Creates / voids Apple Wallet + Google Wallet membership passes for approved creators.
// Auth via long-lived JWT bearer (PASSKIT_API_KEY) issued in the PassKit dashboard.

const PASSKIT_API_URL = process.env.PASSKIT_API_URL || "https://api.pub2.passkit.io";
const PASSKIT_API_KEY = process.env.PASSKIT_API_KEY || "";
const PASSKIT_PROGRAM_ID = process.env.PASSKIT_PROGRAM_ID || "";
const PASSKIT_TIER_ID = process.env.PASSKIT_TIER_ID || "";

type CreateMemberInput = {
  externalId: string;          // our creators.id (UUID)
  displayName: string;         // full_name
  instagramHandle: string;     // @handle (without @)
  email: string;
  photoUrl?: string;           // optional avatar
  monthlyCreditCop?: number;   // default 1.5M COP
  validUntil?: string;         // ISO date — when the pass expires (default 1 month from now)
};

type CreateMemberResult = {
  memberId: string;
  passUrl: string;             // .pkpass for Apple Wallet
  googlePayUrl: string;        // Google Wallet "Save" link
};

async function passkitFetch(path: string, options: RequestInit = {}): Promise<Response> {
  if (!PASSKIT_API_KEY) {
    throw new Error("PASSKIT_API_KEY no configurada en .env.local");
  }
  return fetch(`${PASSKIT_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PASSKIT_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
}

// Retry once on 5xx / network failures. Return parsed JSON or throw with PassKit error body.
async function passkitJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await passkitFetch(path, options);
      const body = await res.text();
      if (!res.ok) {
        if (res.status >= 500 && attempt === 0) {
          lastErr = new Error(`PassKit ${res.status}: ${body}`);
          continue;
        }
        throw new Error(`PassKit ${res.status}: ${body || res.statusText}`);
      }
      return body ? (JSON.parse(body) as T) : ({} as T);
    } catch (err) {
      lastErr = err;
      if (attempt === 1) throw err;
    }
  }
  throw lastErr;
}

export async function createMember(input: CreateMemberInput): Promise<CreateMemberResult> {
  if (!PASSKIT_PROGRAM_ID || !PASSKIT_TIER_ID) {
    throw new Error("PASSKIT_PROGRAM_ID o PASSKIT_TIER_ID no configurados");
  }

  const validUntil = input.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const monthlyCredit = input.monthlyCreditCop ?? 1_500_000;

  // PassKit Members service — create a member tied to a Program + Tier
  // Docs: https://docs.passkit.io/protocols/member/
  const payload = {
    programId: PASSKIT_PROGRAM_ID,
    tierId: PASSKIT_TIER_ID,
    externalId: input.externalId,
    person: {
      displayName: input.displayName,
      forename: input.displayName.split(" ")[0],
      surname: input.displayName.split(" ").slice(1).join(" ") || input.displayName.split(" ")[0],
      emailAddress: input.email,
    },
    metaData: {
      instagramHandle: input.instagramHandle.replace(/^@/, ""),
      monthlyCreditCop: String(monthlyCredit),
      validUntil,
      photoUrl: input.photoUrl || "",
    },
  };

  type RawMember = { id?: string };

  const member = await passkitJSON<RawMember>("/members/member", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const memberId = member.id;
  if (!memberId) {
    throw new Error(`PassKit response sin memberId: ${JSON.stringify(member)}`);
  }

  // PassKit serves a universal landing page that detects device (iOS -> Apple Wallet, Android -> Google Wallet)
  // Region is pub2 (set on PassKit account level).
  const passUrl = `https://pub2.pskt.io/${memberId}`;

  return {
    memberId,
    passUrl,
    googlePayUrl: passUrl, // Same URL works for both platforms; PassKit handles device detection
  };
}

export async function voidMember(memberId: string): Promise<void> {
  await passkitJSON(`/members/member/${encodeURIComponent(memberId)}`, { method: "DELETE" });
}

export async function getMember(memberId: string) {
  return passkitJSON(`/members/member/${encodeURIComponent(memberId)}`);
}
