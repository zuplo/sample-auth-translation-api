import { HttpProblems, ZuploContext, ZuploRequest } from "@zuplo/runtime";
import { getUserInfo, getUserOrg } from "./data";

/**
 * This policy retrieves the user's profile from the authentication provider
 * then queries the remote (mock) database/api for the user's org. The sets
 * the orgId as a property on the user in order to use on later policies/handlers
 */
export default async function (request: ZuploRequest, context: ZuploContext) {
  // Get the current user
  const user = await getUserInfo(request, context);
  context.log.debug(user);
  // Get the current user's orgId
  const org = await getUserOrg(user);

  if (!org) {
    return HttpProblems.unauthorized(request, context, {
      detail: `User not a member of an organization`,
    });
  }

  context.custom.orgId = org.id;

  return request;
}
