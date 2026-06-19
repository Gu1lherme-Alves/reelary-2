// Helpers do lado cliente para o fluxo OAuth do Instagram.
// O App ID é buscado do servidor (vive nas variáveis de ambiente do backend).

export const INSTAGRAM_REDIRECT_PATH = "/auth/instagram/callback";

export function buildInstagramAuthUrl(appId: string): string {
  const redirectUri = `${window.location.origin}${INSTAGRAM_REDIRECT_PATH}`;
  const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management";

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    auth_type: "rerequest",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export function getInstagramRedirectUri(): string {
  return `${window.location.origin}${INSTAGRAM_REDIRECT_PATH}`;
}
