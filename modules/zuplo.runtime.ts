// This file is used to check that you have setup your project's
// environment variables correctly. It is not necessary in most 
// projects but demonstrates the power of Zuplo's extensibility!

// See the docs for this file at 
// https://zuplo.com/docs/articles/runtime-extensions

import { RuntimeExtensions, environment } from "@zuplo/runtime";

let verified = false;

const requiredEnvVars = ['AUTH0_DOMAIN', 'AUTH0_AUDIENCE', 'ZAPI_KEY', 'BUCKET_URL'];

function verify(): string | undefined {
  if (verified) {
    return;
  }

  const missingKeys = [];

  requiredEnvVars.forEach(key => {
    if (!environment[key]) {
      missingKeys.push(key);
    }
  })

  if (missingKeys.length > 0) {
    return `Your project is missing some required Environment Variables: '${missingKeys.join(", ")}'`;
  }

  verified = true;
}

export function runtimeInit(runtime: RuntimeExtensions) {
  runtime.addRequestHook(async (request, context) => {

    const url = new URL(request.url);

    // don't intercept CORS, that makes debugging hard
    // in the browser. Also, don't mess with built-in routes
    if (request.method === "OPTIONS") {
      return request;
    }

    const result = verify();
    if (result) {
      return new Response(result, { status: 500 });
    }

    return request;
  })
}