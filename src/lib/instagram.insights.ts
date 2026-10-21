import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  plays?: number;
  reach?: number;
  shares?: number;
  saved?: number;
}

// Helper to fetch JSON from Facebook or Instagram Graph API safely with timeout and auth error detection
async function safeGraphFetch(
  url: string,
  timeoutMs = 8000,
): Promise<{
  ok: boolean;
  data?: any;
  isAuthError?: boolean;
  errorMessage?: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      let isAuthError = false;
      let msg = errText;

      try {
        const parsed = JSON.parse(errText);
        const code = parsed?.error?.code;
        const subcode = parsed?.error?.error_subcode;
        const type = parsed?.error?.type;
        msg = parsed?.error?.message || errText;

        if (code === 190 || subcode === 463 || subcode === 467 || type === "OAuthException") {
          isAuthError = true;
        }
      } catch (_err) {
        // Ignora erro se a resposta não for JSON
      }

      console.warn(`Graph API fetch returned ${res.status} for ${url.split("?")[0]}:`, msg);
      return { ok: false, isAuthError, errorMessage: msg };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (e: any) {
    console.warn(`Graph API network error for ${url.split("?")[0]}:`, e?.message || e);
    return { ok: false, errorMessage: e?.message || "Network error" };
  }
}

// Helper to fetch insights for a specific media item with targeted metrics by media type (fast & resilient)
async function fetchMediaInsights(
  baseUrl: string,
  mediaId: string,
  accessToken: string,
  mediaType?: string,
) {
  let plays = 0;
  let reach = 0;
  let shares = 0;
  let saved = 0;

  const isVideo = mediaType === "VIDEO";
  const isImageOrCarousel = mediaType === "IMAGE" || mediaType === "CAROUSEL_ALBUM";

  // Define prioritized metric queries based on Instagram Graph API capabilities
  const queriesToTry: string[] = [];

  if (isVideo) {
    // 1st choice: modern Reels API metrics
    queriesToTry.push("views,reach,saved,shares");
    // Fallback: older plays metric
    queriesToTry.push("plays,reach,saved,shares");
    // Final fallback: basic engagement without views
    queriesToTry.push("reach,saved,shares");
  } else if (isImageOrCarousel) {
    // Photos/Carousels do NOT support views/plays (causes 400 error). Only reach & saved
    queriesToTry.push("reach,saved");
    queriesToTry.push("reach,saved,impressions");
  } else {
    queriesToTry.push("views,reach,saved,shares");
    queriesToTry.push("reach,saved");
  }

  for (const metricStr of queriesToTry) {
    const url = `${baseUrl}/${mediaId}/insights?metric=${metricStr}&access_token=${encodeURIComponent(accessToken)}`;
    const res = await safeGraphFetch(url, 4000);

    if (res.ok && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      res.data.data.forEach((metricObj: any) => {
        const val = Number(metricObj?.values?.[0]?.value ?? 0) || 0;
        if (
          metricObj.name === "plays" ||
          metricObj.name === "views" ||
          metricObj.name === "ig_reels_aggregated_all_plays_count" ||
          metricObj.name === "clips_replays_count"
        ) {
          plays = Math.max(plays, val);
        }
        if (metricObj.name === "reach") {
          reach = Math.max(reach, val);
        }
        if (metricObj.name === "impressions" && plays === 0) {
          plays = Math.max(plays, val);
        }
        if (metricObj.name === "saved") {
          saved = Math.max(saved, val);
        }
        if (metricObj.name === "shares") {
          shares = Math.max(shares, val);
        }
      });

      // Stop once we get valid data
      break;
    }
  }

  return { plays, reach, shares, saved };
}

// Helper to fetch account level insights from Meta Graph API (optimized, max 2 calls)
async function fetchAccountLevelInsights(
  baseUrl: string,
  instagramUserId: string,
  accessToken: string,
) {
  let accountReach = 0;
  let accountImpressions = 0;

  // Try standard 28-day window with primary metrics
  const url1 = `${baseUrl}/${instagramUserId}/insights?metric=reach,impressions&period=days_28&access_token=${encodeURIComponent(accessToken)}`;
  const res1 = await safeGraphFetch(url1, 4000);

  if (res1.ok && res1.data?.data && Array.isArray(res1.data.data)) {
    res1.data.data.forEach((metricObj: any) => {
      const val = Number(metricObj?.values?.[0]?.value ?? metricObj?.total_value?.value ?? 0) || 0;
      if (metricObj.name === "reach") accountReach = Math.max(accountReach, val);
      if (metricObj.name === "impressions" || metricObj.name === "views") {
        accountImpressions = Math.max(accountImpressions, val);
      }
    });
  } else {
    // Single fallback with views/reach
    const url2 = `${baseUrl}/${instagramUserId}/insights?metric=reach,views&period=days_28&access_token=${encodeURIComponent(accessToken)}`;
    const res2 = await safeGraphFetch(url2, 4000);
    if (res2.ok && res2.data?.data && Array.isArray(res2.data.data)) {
      res2.data.data.forEach((metricObj: any) => {
        const val =
          Number(metricObj?.values?.[0]?.value ?? metricObj?.total_value?.value ?? 0) || 0;
        if (metricObj.name === "reach") accountReach = Math.max(accountReach, val);
        if (metricObj.name === "views") accountImpressions = Math.max(accountImpressions, val);
      });
    }
  }

  return { accountReach, accountImpressions };
}

// Server Function to Sync a Single Account Insights
export const syncAccountInsightsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        accountId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Fetch account details from Supabase
    const { data: account, error: accErr } = await supabase
      .from("instagram_accounts")
      .select("id, username, instagram_user_id, access_token, hidden")
      .eq("id", data.accountId)
      .eq("user_id", userId)
      .single();

    if (accErr || !account) {
      throw new Error("Conta não encontrada ou sem permissão de acesso.");
    }

    const { access_token, instagram_user_id, username } = account;
    const isFacebookToken = access_token.startsWith("EAA");
    const baseUrl = isFacebookToken
      ? "https://graph.facebook.com/v21.0"
      : "https://graph.instagram.com/v21.0";

    // 2. Fetch Account Profile (Followers, Follows, Media Count, Profile Picture)
    const profileFields =
      "id,username,profile_picture_url,followers_count,follows_count,media_count";
    const profileUrl = `${baseUrl}/${instagram_user_id}?fields=${profileFields}&access_token=${encodeURIComponent(access_token)}`;
    const profileRes = await safeGraphFetch(profileUrl, 6000);

    // Check if token expired or revoked
    if (!profileRes.ok && profileRes.isAuthError) {
      await supabase
        .from("instagram_accounts")
        .update({ token_invalid: true })
        .eq("id", account.id);
      throw new Error(`Token expirado para @${username}. Por favor, reconecte a conta.`);
    }

    const profileData = profileRes.data || {};
    const followersCount = Number(profileData?.followers_count) || 0;
    const followsCount = Number(profileData?.follows_count) || 0;
    const mediaCount = Number(profileData?.media_count) || 0;
    const profilePictureUrl = profileData?.profile_picture_url || null;

    if (profilePictureUrl) {
      await supabase
        .from("instagram_accounts")
        .update({ profile_picture_url: profilePictureUrl, token_invalid: false })
        .eq("id", account.id);
    }

    // 3. Fetch Account-level Insights if available (parallel with media list)
    const [accountInsights, mediaListRes] = await Promise.all([
      fetchAccountLevelInsights(baseUrl, instagram_user_id, access_token),
      safeGraphFetch(
        `${baseUrl}/${instagram_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${encodeURIComponent(access_token)}`,
        6000,
      ),
    ]);

    const { accountReach, accountImpressions } = accountInsights;
    const rawMediaList: any[] = mediaListRes?.data?.data || [];

    // 4. Fetch Insights for media items in concurrent batches of 4 (super fast)
    const mediaItems: MediaItem[] = [];
    const mediaRowsToUpsert: any[] = [];
    let sumMediaViews = 0n;
    let sumMediaReach = 0n;
    let sumMediaLikes = 0n;
    let sumMediaComments = 0n;
    let sumMediaShares = 0n;
    let sumMediaSaved = 0n;

    const BATCH_SIZE = 5;
    for (let i = 0; i < rawMediaList.length; i += BATCH_SIZE) {
      const chunk = rawMediaList.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        chunk.map(async (m) => {
          const insights = await fetchMediaInsights(baseUrl, m.id, access_token, m.media_type);
          return { m, ...insights };
        }),
      );

      for (const res of results) {
        const { m, plays, reach, shares, saved } = res;
        const likeCount = Number(m.like_count) || 0;
        const commentsCount = Number(m.comments_count) || 0;

        sumMediaViews += BigInt(plays);
        sumMediaReach += BigInt(reach);
        sumMediaLikes += BigInt(likeCount);
        sumMediaComments += BigInt(commentsCount);
        sumMediaShares += BigInt(shares);
        sumMediaSaved += BigInt(saved);

        const totalInteractions = likeCount + commentsCount + shares + saved;
        const divisor = plays > 0 ? plays : reach > 0 ? reach : 1;
        const itemEngagementRate = divisor > 0 ? (totalInteractions / divisor) * 100 : 0;

        mediaItems.push({
          id: m.id,
          caption: m.caption || "",
          media_type: m.media_type,
          permalink: m.permalink,
          thumbnail_url: m.thumbnail_url || m.media_url,
          media_url: m.media_url,
          timestamp: m.timestamp,
          like_count: likeCount,
          comments_count: commentsCount,
          plays,
          reach,
          shares,
          saved,
        });

        mediaRowsToUpsert.push({
          user_id: userId,
          instagram_account_id: account.id,
          ig_media_id: m.id,
          caption: m.caption || null,
          media_type: m.media_type || "VIDEO",
          permalink: m.permalink || null,
          thumbnail_url: m.thumbnail_url || m.media_url || null,
          media_url: m.media_url || null,
          views_count: plays,
          reach_count: reach,
          like_count: likeCount,
          comments_count: commentsCount,
          shares_count: shares,
          saved_count: saved,
          engagement_rate: parseFloat(itemEngagementRate.toFixed(2)),
          published_at: m.timestamp ? new Date(m.timestamp).toISOString() : null,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Single batch upsert for all media items to save database round-trips
    if (mediaRowsToUpsert.length > 0) {
      const { error: batchErr } = await supabase
        .from("instagram_media_insights")
        .upsert(mediaRowsToUpsert, {
          onConflict: "instagram_account_id,ig_media_id",
        });

      if (batchErr) {
        console.warn("Media insights batch upsert warning:", batchErr);
      }
    }

    // 5. Determine total views and total reach
    const finalTotalViews = Math.max(Number(sumMediaViews), accountImpressions);
    const finalTotalReach = Math.max(Number(sumMediaReach), accountReach);
    const finalTotalLikes = Number(sumMediaLikes);
    const finalTotalComments = Number(sumMediaComments);
    const finalTotalShares = Number(sumMediaShares);
    const finalTotalSaved = Number(sumMediaSaved);

    // 6. Calculate Overall Account Engagement Rate
    const sumAllInteractions =
      finalTotalLikes + finalTotalComments + finalTotalShares + finalTotalSaved;
    let overallEngagementRate = 0;

    if (finalTotalViews > 0) {
      overallEngagementRate = (sumAllInteractions / finalTotalViews) * 100;
    } else if (finalTotalReach > 0) {
      overallEngagementRate = (sumAllInteractions / finalTotalReach) * 100;
    } else if (followersCount > 0 && rawMediaList.length > 0) {
      overallEngagementRate = (sumAllInteractions / (followersCount * rawMediaList.length)) * 100;
    }

    // 7. Upsert Account Insights in Supabase
    const nowIso = new Date().toISOString();
    const { error: upsertErr } = await supabase.from("instagram_account_insights").upsert(
      {
        user_id: userId,
        instagram_account_id: account.id,
        followers_count: followersCount,
        follows_count: followsCount,
        media_count: mediaCount,
        profile_picture_url: profilePictureUrl,
        total_views: finalTotalViews,
        total_reach: finalTotalReach,
        total_likes: finalTotalLikes,
        total_comments: finalTotalComments,
        total_shares: finalTotalShares,
        total_saved: finalTotalSaved,
        engagement_rate: parseFloat(overallEngagementRate.toFixed(2)),
        last_synced_at: nowIso,
        raw_insights: {
          syncedMediaCount: rawMediaList.length,
          accountReach,
          accountImpressions,
          lastSyncStatus: "success",
        },
        updated_at: nowIso,
      },
      { onConflict: "instagram_account_id" },
    );

    if (upsertErr) {
      console.error("Error upserting account insights:", upsertErr);
      throw new Error("Falha ao salvar métricas no banco de dados.");
    }

    return {
      success: true,
      username,
      profilePictureUrl,
      followersCount,
      totalViews: finalTotalViews,
      totalReach: finalTotalReach,
      engagementRate: parseFloat(overallEngagementRate.toFixed(2)),
      syncedMediaCount: rawMediaList.length,
      lastSyncedAt: nowIso,
    };
  });

// Server Function to Sync All User Accounts (backend fallback with safe batching)
export const syncAllAccountsInsightsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: accounts, error } = await supabase
      .from("instagram_accounts")
      .select("id, username")
      .eq("user_id", userId)
      .eq("hidden", false);

    if (error) throw error;
    if (!accounts || accounts.length === 0) {
      return { total: 0, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    // Process accounts in chunks of 2 to avoid overwhelming network while staying resilient
    const CHUNK_SIZE = 2;
    for (let i = 0; i < accounts.length; i += CHUNK_SIZE) {
      const chunk = accounts.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((acc) => syncAccountInsightsFn({ data: { accountId: acc.id } })),
      );

      for (let j = 0; j < results.length; j++) {
        const res = results[j];
        if (res.status === "fulfilled") {
          synced++;
        } else {
          console.warn(`Failed syncing account ${chunk[j].username}:`, res.reason);
          failed++;
        }
      }
    }

    return { total: accounts.length, synced, failed };
  });

// Server Function to Fetch Cached Insights for UI Display (Fast Sub-50ms query)
export const getCachedInsightsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1. Fetch Accounts with Categories and Profile Picture
    const { data: accounts, error: accErr } = await supabase
      .from("instagram_accounts")
      .select(
        `
        id,
        username,
        profile_picture_url,
        category_id,
        hidden,
        created_at,
        account_categories(id, name, color)
      `,
      )
      .eq("user_id", userId)
      .eq("hidden", false)
      .order("created_at", { ascending: false });

    if (accErr) throw accErr;
    if (!accounts || accounts.length === 0) {
      return { accounts: [], topMedia: [], summary: null };
    }

    // 2. Fetch Account Insights
    const accountIds = accounts.map((a) => a.id);
    const { data: insightsData, error: insErr } = await supabase
      .from("instagram_account_insights")
      .select("*")
      .in("instagram_account_id", accountIds);

    if (insErr) throw insErr;

    // 3. Fetch Top Media (Top 12 across all accounts by views/likes)
    const { data: topMediaData, error: mediaErr } = await supabase
      .from("instagram_media_insights")
      .select(
        `
        id,
        instagram_account_id,
        ig_media_id,
        caption,
        media_type,
        permalink,
        thumbnail_url,
        media_url,
        views_count,
        reach_count,
        like_count,
        comments_count,
        shares_count,
        saved_count,
        engagement_rate,
        published_at,
        last_synced_at,
        instagram_accounts(username, profile_picture_url, account_categories(name, color))
      `,
      )
      .in("instagram_account_id", accountIds)
      .order("views_count", { ascending: false })
      .limit(12);

    if (mediaErr) throw mediaErr;

    // 4. Fetch pending scheduled posts count per account
    const { data: pendingPosts } = await supabase
      .from("scheduled_posts")
      .select("instagram_account_id")
      .eq("user_id", userId)
      .eq("status", "pending");

    const pendingCountMap = new Map<string, number>();
    (pendingPosts || []).forEach((p) => {
      pendingCountMap.set(
        p.instagram_account_id,
        (pendingCountMap.get(p.instagram_account_id) || 0) + 1,
      );
    });

    const insightsMap = new Map((insightsData || []).map((ins) => [ins.instagram_account_id, ins]));

    const accountsWithInsights = accounts.map((acc) => {
      const ins = insightsMap.get(acc.id);
      const totalLikes = Number(ins?.total_likes) || 0;
      const totalComments = Number(ins?.total_comments) || 0;
      const totalShares = Number(ins?.total_shares) || 0;
      const totalSaved = Number(ins?.total_saved) || 0;
      const totalInteractions = totalLikes + totalComments + totalShares + totalSaved;

      return {
        ...acc,
        profile_picture_url: acc.profile_picture_url || ins?.profile_picture_url || null,
        insights: ins || null,
        followersCount: ins?.followers_count ?? 0,
        totalViews: ins?.total_views ?? 0,
        totalReach: ins?.total_reach ?? 0,
        totalLikes,
        totalComments,
        totalShares,
        totalSaved,
        totalInteractions,
        pendingCount: pendingCountMap.get(acc.id) || 0,
        engagementRate: ins?.engagement_rate ?? 0,
        mediaCount: ins?.media_count ?? 0,
        lastSyncedAt: ins?.last_synced_at ?? null,
      };
    });

    // Compute Global Aggregates
    let globalViews = 0;
    let globalLikes = 0;
    let globalComments = 0;
    let globalFollowers = 0;

    accountsWithInsights.forEach((a) => {
      globalViews += Number(a.totalViews) || 0;
      globalLikes += Number(a.totalLikes) || 0;
      globalComments += Number(a.totalComments) || 0;
      globalFollowers += Number(a.followersCount) || 0;
    });

    const summary = {
      totalAccounts: accounts.length,
      syncedAccounts: (insightsData || []).length,
      globalViews,
      globalLikes,
      globalComments,
      globalFollowers,
    };

    return {
      accounts: accountsWithInsights,
      topMedia: topMediaData || [],
      summary,
    };
  });
