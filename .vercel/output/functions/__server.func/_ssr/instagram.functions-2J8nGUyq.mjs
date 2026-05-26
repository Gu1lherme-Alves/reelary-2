import { r as reactExports } from "../_libs/react.mjs";
import { d as useRouter } from "../_libs/tanstack__react-router.mjs";
import { y as isRedirect } from "../_libs/tanstack__router-core.mjs";
import {
  a as createServerFn,
  T as TSS_SERVER_FUNCTION,
  b as getServerFnById,
} from "./server-5VHo_4WK.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DxRENTyW.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
function useServerFn(serverFn) {
  const router = useRouter();
  return reactExports.useCallback(
    async (...args) => {
      try {
        const res = await serverFn(...args);
        if (isRedirect(res)) throw res;
        return res;
      } catch (err) {
        if (isRedirect(err)) {
          err.options._fromLocation = router.stores.location.get();
          return router.navigate(router.resolveRedirect(err).options);
        }
        throw err;
      }
    },
    [router, serverFn],
  );
}
const INSTAGRAM_REDIRECT_PATH = "/auth/instagram/callback";
function buildInstagramAuthUrl(appId) {
  const redirectUri = `${window.location.origin}${INSTAGRAM_REDIRECT_PATH}`;
  const scope =
    "instagram_content_publish,pages_show_list,instagram_basic,pages_read_engagement,business_management";
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    auth_type: "rerequest",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}
function getInstagramRedirectUri() {
  return `${window.location.origin}${INSTAGRAM_REDIRECT_PATH}`;
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true,
  });
};
const getMetaAppId = createServerFn({
  method: "GET",
}).handler(createSsrRpc("2127f32bbafdbc247a48f7824e13a5760991fb577779fe58db919d1ccfc5aa23"));
const connectInstagramAccount = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    objectType({
      code: stringType().min(1).max(2e3),
      redirectUri: stringType().url().max(500),
    }).parse(input),
  )
  .handler(createSsrRpc("41383486c2fa86cede87f45c84053abfc0df7059bd8fe2d129ebf819231343c3"));
export {
  getMetaAppId as a,
  buildInstagramAuthUrl as b,
  connectInstagramAccount as c,
  getInstagramRedirectUri as g,
  useServerFn as u,
};
