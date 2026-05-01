const PHYLLO_API_URL = process.env.PHYLLO_API_URL || "https://api.staging.getphyllo.com";

function getAuthHeader() {
  const id = process.env.PHYLLO_CLIENT_ID;
  const secret = process.env.PHYLLO_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("PHYLLO_CLIENT_ID / PHYLLO_CLIENT_SECRET no configurados en el entorno");
  }
  const token = Buffer.from(`${id}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

export async function phylloFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PHYLLO_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res.json();
}

export async function createPhylloUser(name: string, externalId: string) {
  return phylloFetch("/v1/users", {
    method: "POST",
    body: JSON.stringify({ name, external_id: externalId }),
  });
}

export async function createSDKToken(userId: string) {
  return phylloFetch("/v1/sdk-tokens", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      products: ["IDENTITY", "ENGAGEMENT"],
    }),
  });
}
