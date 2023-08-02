import {
  HttpProblems,
  ZuploContext,
  ZuploRequest,
  environment,
} from "@zuplo/runtime";

const ZAPI_KEY = environment.ZAPI_KEY;
const BUCKET_URL = environment.BUCKET_URL;

/**
 * This policy retrieves an API Key Consumer and validates that
 * the user's orgId is the owner (via a tag) of the consumer
 */
export default async function (request: ZuploRequest, context: ZuploContext) {
  const consumerName = request.params.consumerName;

  if (!consumerName) {
    throw new Error(
      `Invalid usage of verify-jwt-consumer policy - no 'consumerName' param found`
    );
  }

  const response = await fetch(
    `${BUCKET_URL}/consumers/${consumerName}?include-api-keys=true`,
    {
      headers: {
        authorization: `Bearer ${ZAPI_KEY}`,
      },
    }
  );

  if (response.status !== 200) {
    return response;
  }

  const data = await response.json();

  const consumerOrgId = data?.tags["orgId"];

  if (consumerOrgId !== request.user.data.orgId) {
    return HttpProblems.unauthorized(request, context, {
      detail: `You do not have access to this consumer or consumer not found`,
    });
  }

  // add the consumer to the request context for use later
  context.custom.consumer = data;

  return request;
}
