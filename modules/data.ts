import { environment, ZuploRequest } from "@zuplo/runtime";

/**
 * This is serves as a mock of a database, api,
 * or other mechanism to store users of the app
 */
const DATA = {
  orgs: [
    {
      id: "1000",
      name: "Fabrikam",
      members: ["nate@zuplo.com"],
    },
    {
      id: "1001",
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
  name?: string;
  email?: string;
}

/**
 * Gets the org that the user is a member of
 *
 * This mock function performs a 500ms sleep in order to simulate calling a
 * database or exeternal API in order to retrieve the org
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
export async function getUserInfo(request: ZuploRequest): Promise<UserInfo> {
  // User Info: https://auth0.com/docs/api/authentication#get-user-info
  const response = await fetch(`https://${environment.AUTH0_DOMAIN}/userinfo`, {
    headers: {
      "content-type": "application/json",
      authorization: request.headers.get("authorization"),
    },
  });
  if (response.status !== 200) {
    throw new Error("Could not get user info from identity provider");
  }
  return await response.json();
}
