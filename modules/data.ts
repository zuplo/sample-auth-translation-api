import { environment, ZuploRequest, MemoryZoneReadThroughCache, ZuploContext } from "@zuplo/runtime";

/**
 * This is serves as a mock of a database, api,
 * or other mechanism to store users of the app
 */
const DATA = {
  orgs: [
    {
      id: "sales-east",
      name: "Contoso",
      members: ["josh@zuplo.com"],
    },
  ],
};

export interface Organization {
  id: string;
  name: string;
}

interface UserInfo {
  sub: string;
  email: string;
}

/**
 * Gets the org that the user is a member of
 *
 * This mock function performs a 500ms sleep in order to simulate calling a
 * database or external API in order to retrieve the org
 */
export async function getUserOrg(
  user: UserInfo
): Promise<Organization | undefined> {
  // Call the mock data store to get the user's org
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find the orgs in which the user is a member of
      const org = DATA.orgs.find((o) => o.members.includes(user.email));
      resolve(org);
    }, 500);
  });
}

/**
 * Gets the user profile info
 *
 * Normally, you would store the mapping between the userId (i.e. sub)
 * and email address in your database so that you don't perform this request
 * to the identity provider on every API request
 */
export async function getUserInfo(request: ZuploRequest, context: ZuploContext): Promise<UserInfo> {

  // IDPs rate limit their user-info endpoints, so we cache the result based on the user sub
  const cache = new MemoryZoneReadThroughCache<UserInfo>("user-info", context);

  const cachedData = await cache.get(request.user.sub);

  if (cachedData) {
    return cachedData;
  }

  // User Info: https://auth0.com/docs/api/authentication#get-user-info
  const response = await fetch(`https://${environment.AUTH0_DOMAIN}/userinfo`, {
    headers: {
      "content-type": "application/json",
      authorization: request.headers.get("authorization"),
    },
  });
  if (response.status !== 200) {
    throw new Error(`Could not get user info from identity provider (status: ${response.status} - ${response.statusText})`);
  }

  // store in cache for next time
  const data = await response.json();
  cache.put(request.user.sub, data, 3600);

  return data;
}
