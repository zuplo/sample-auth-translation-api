import { ZuploContext, ZuploRequest, environment, HttpProblems } from "@zuplo/runtime";

const ZAPI_KEY = environment.ZAPI_KEY;
const BUCKET_URL = environment.BUCKET_URL;

export default async function (
  request: ZuploRequest,
  context: ZuploContext,
  options: never,
  policyName: string
) {
  // your policy code goes here, and can use the options to perform any
  // configuration
  // See the docs: https://www.zuplo.com/docs/policies/custom-code-inbound

  const consumerName = request.params.consumerName;

  if (!consumerName) {
    throw new Error(`Invalid usage of verify-jwt-consumer policy - no 'consumerName' param found`);
  }

  const userOrgId = request.user.data["https://org-id"];

  if (!userOrgId) {
    return HttpProblems.unauthorized(request, context, { detail: `Auth token mising claim` });
  }

  const response = await fetch(`${BUCKET_URL}/consumers/${consumerName}?include-api-keys=true`, {
    headers: {
      authorization: `Bearer ${ZAPI_KEY}`
    }
  });

  if (response.status !== 200) {
    return response;
  }

  const data = await response.json();

  const consumerOrgId = data?.tags["orgId"];

  if (consumerOrgId !== userOrgId) {
    return HttpProblems.unauthorized(request, context, { detail: `You do not have access to this consumer or consumer not found` });
  }

  // add the consumer to the request context for use later
  context.custom.consumer = data;

  return request;
}