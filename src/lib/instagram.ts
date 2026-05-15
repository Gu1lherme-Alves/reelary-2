// Instagram OAuth helpers. Estrutura apenas — a troca real de token deve ser feita
// em servidor (server function) usando META_APP_SECRET. Por enquanto o callback
// aceita inserção manual para validar o fluxo de UI.

const META_APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;

export function getInstagramAuthUrl(): string {
  const redirectUri = `${window.location.origin}/auth/instagram/callback`;
  const scope = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  if (!META_APP_ID) {
    return "#missing-meta-app-id";
  }

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export const META_APP_ID_CONFIGURED = !!META_APP_ID;
