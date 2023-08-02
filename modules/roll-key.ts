import { ZuploContext, ZuploRequest, environment } from "@zuplo/runtime";

const ZAPI_KEY = environment.ZAPI_KEY;
const BUCKET_URL = environment.BUCKET_URL;

const expiryLookup = {
  "1-hour": 3600,
  "24-hours": 86400,
  "7-days": 604800,
};

type ExpiryPeriod = keyof typeof expiryLookup;

interface RollRequestBody {
  expireIn: ExpiryPeriod;
}

/**
 * A custom code handler that calls the Zuplo API Key service
 * to roll an API key
 */
export async function roll(request: ZuploRequest, context: ZuploContext) {
  const consumerName = request.params.consumerName;
  const body: RollRequestBody = await request.json();

  // reuse the consumer data from the incoming policy
  const consumer = context.custom.consumer;

  const targetExpiration = Date.now() + expiryLookup[body.expireIn];

  // Find keys with no expiry set
  const keysToUpdate = consumer.apiKeys.filter((k) => k.expiresOn === null);

  // Set the expiry of all keys, do in sequence (not fastest)
  for (const key of keysToUpdate) {
    const url = `${BUCKET_URL}/consumers/${consumerName}/keys/${key.id}`;
    const body = {
      expiresOn: new Date(targetExpiration),
    };
    const updateResponse = await fetch(url, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        authorization: `Bearer ${ZAPI_KEY}`,
        "content-type": "application/json",
      },
    });

    context.log.info(
      url,
      body,
      updateResponse.status,
      updateResponse.statusText
    );

    if (updateResponse.status !== 200) {
      return updateResponse;
    }
  }

  const newKeyResponse = await fetch(
    `${BUCKET_URL}/consumers/${consumerName}/keys`,
    {
      method: "POST",
      body: "{}",
      headers: {
        authorization: `Bearer ${ZAPI_KEY}`,
        "content-type": "application/json",
      },
    }
  );

  if (newKeyResponse.status !== 201) {
    return newKeyResponse;
  }

  return new Response(null, { status: 200 });
}

export async function deleteKey(request: ZuploRequest, context: ZuploContext) {}
