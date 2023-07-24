import { HttpProblems, ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function (
  request: ZuploRequest,
  context: ZuploContext,
  options: never,
  policyName: string
) {

  const { keyId } = request.params;
  const consumer = context.custom.consumer;

  // Verify that this key is part of this consumer
  const key = consumer.apiKeys.find(k => k.id === keyId);
  if (!key) {
    return HttpProblems.unauthorized(request, context, { detail: `You do not have access to this key or key does not exist` });
  }

  return request;
}
