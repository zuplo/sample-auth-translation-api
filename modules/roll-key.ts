import { ZuploContext, ZuploRequest, environment, HttpProblems } from "@zuplo/runtime";

const ZAPI_KEY = environment.ZAPI_KEY;
const BUCKET_URL = environment.BUCKET_URL;

type ExpiryPeriod = "1-hour" | "24-hours" | "7-days";

const expiryLookup: Record<ExpiryPeriod, number> = {
  "1-hour": 3600,
  "24-hours": 86400,
  "7-days": 604800,
};

// hi Ayan
interface RollRequestBody { 
  expireIn: ExpiryPeriod
}

export async function roll(request: ZuploRequest, context: ZuploContext) {

  const consumerName = request.params.consumerName;
  const body: RollRequestBody = await request.json();

  // reuse the consumer data from the incoming policy
  const consumer = context.custom.consumer;

  const targetExpiration = Date.now() + expiryLookup[body.expireIn];

  // Find keys with no expiry set
  const keysToUpdate = consumer.apiKeys.filter(k => k.expiresOn === null);

  // Set the expiry of all keys, do in sequence (not fastest)
  for (const key of keysToUpdate) {
    const url = `${BUCKET_URL}/consumers/${consumerName}/keys/${key.id}`;
    const body = {
      expiresOn: new Date(targetExpiration)
    };
    const updateResponse = await fetch(url, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        authorization: `Bearer ${ZAPI_KEY}`,
        "content-type": "application/json"
      }
    });

    context.log.info(url, body, updateResponse.status, updateResponse.statusText);

    if (updateResponse.status !== 200) {
      return updateResponse;
    }
  }

  const newKeyResponse = await fetch(`${BUCKET_URL}/consumers/${consumerName}/keys`, {
    method: "POST",
    body: "{}",
    headers: {
      authorization: `Bearer ${ZAPI_KEY}`,
      "content-type": "application/json"
    }
  });

  if (newKeyResponse.status !== 201) {
    return newKeyResponse;
  }

  return new Response(null, { status: 200 });
}

export async function deleteKey(request: ZuploRequest, context: ZuploContext) {





}
