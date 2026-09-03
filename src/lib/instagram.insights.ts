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

// Helper to fetch JSON from Facebook or Instagram Graph API safely
async function safeGraphFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Graph API fetch failed (${res.status}) for ${url.split("?")[0]}:`, errText);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn(`Graph API network error for ${url.split("?")[0]}:`, e);
    return null;
  }
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

    // 2. Fetch Account Profile (Followers, Follows, Media Count)
    const profileFields = "id,username,followers_count,follows_count,media_count";
    const profileUrl = `${baseUrl}/${instagram_user_id}?fields=${profileFields}&access_token=${encodeURIComponent(access_token)}`;
    const profileData = await safeGraphFetch(profileUrl);

    const followersCount = Number(profileData?.followers_count) || 0;
    const followsCount = Number(profileData?.follows_count) || 0;
    const mediaCount = Number(profileData?.media_count) || 0;

    // 3. Fetch Recent Media Items (up to 30 most recent posts/reels)
    const mediaFields =
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
    const mediaListUrl = `${baseUrl}/${instagram_user_id}/media?fields=${mediaFields}&limit=30&access_token=${encodeURIComponent(access_token)}`;
    const mediaJson = await safeGraphFetch(mediaListUrl);
    const rawMediaList: any[] = mediaJson?.data || [];

    // 4. Fetch Insights for each media item (Views/Plays, Reach, Shares, Saved)
    const mediaItems: MediaItem[] = [];
    let totalViews = 0n;
    let totalReach = 0n;
    let totalLikes = 0n;
    let totalComments = 0n;
    let totalShares = 0n;
    let totalSaved = 0n;

    for (const m of rawMediaList) {
      const likeCount = Number(m.like_count) || 0;
      const commentsCount = Number(m.comments_count) || 0;
      let plays = 0;
      let reach = 0;
      let shares = 0;
      let saved = 0;

      // Only attempt insight fetching if it's a video/reel
      if (m.media_type === "VIDEO" || m.media_type === "REELS") {
        const insightsUrl = `${baseUrl}/${m.id}/insights?metric=plays,reach,saved,shares,total_interactions&access_token=${encodeURIComponent(access_token)}`;
        const insightsJson = await safeGraphFetch(insightsUrl);

        if (insightsJson?.data && Array.isArray(insightsJson.data)) {
          insightsJson.data.forEach((metricObj: any) => {
            const val = metricObj?.values?.[0]?.value ?? 0;
            if (metricObj.name === "plays") plays = Number(val) || 0;
            if (metricObj.name === "reach") reach = Number(val) || 0;
            if (metricObj.name === "saved") saved = Number(val) || 0;
            if (metricObj.name === "shares") shares = Number(val) || 0;
          });
        }
      }

      totalViews += BigInt(plays);
      totalReach += BigInt(reach);
      totalLikes += BigInt(likeCount);
      totalComments += BigInt(commentsCount);
      totalShares += BigInt(shares);
      totalSaved += BigInt(saved);

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

      // Upsert into instagram_media_insights
      await supabase.from("instagram_media_insights").upsert(
        {
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
        },
        { onConflict: "instagram_account_id,ig_media_id" },
      );
    }

    // 5. Calculate Overall Account Engagement Rate
    const sumAllInteractions = Number(totalLikes + totalComments + totalShares + totalSaved);
    let overallEngagementRate = 0;

    if (totalViews > 0n) {
      overallEngagementRate = (sumAllInteractions / Number(totalViews)) * 100;
    } else if (followersCount > 0 && rawMediaList.length > 0) {
      overallEngagementRate =
        (sumAllInteractions / (followersCount * rawMediaList.length)) * 100;
    }

    // 6. Upsert Account Insights in Supabase
    const nowIso = new Date().toISOString();
    const { error: upsertErr } = await supabase.from("instagram_account_insights").upsert(
      {
        user_id: userId,
        instagram_account_id: account.id,
        followers_count: followersCount,
        follows_count: followsCount,
        media_count: mediaCount,
        total_views: Number(totalViews),
        total_reach: Number(totalReach),
        total_likes: Number(totalLikes),
        total_comments: Number(totalComments),
        total_shares: Number(totalShares),
        total_saved: Number(totalSaved),
        engagement_rate: parseFloat(overallEngagementRate.toFixed(2)),
        last_synced_at: nowIso,
        raw_insights: {
          syncedMediaCount: rawMediaList.length,
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
      followersCount,
      totalViews: Number(totalViews),
      engagementRate: parseFloat(overallEngagementRate.toFixed(2)),
      syncedMediaCount: rawMediaList.length,
      lastSyncedAt: nowIso,
    };
  });

// Server Function to Sync All User Accounts
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

    for (const acc of accounts) {
      try {
        await syncAccountInsightsFn({ data: { accountId: acc.id } });
        synced++;
      } catch (err) {
        console.warn(`Failed syncing insights for account ${acc.username}:`, err);
        failed++;
      }
    }

    return { total: accounts.length, synced, failed };
  });

// Server Function to Fetch Cached Insights for UI Display (Fast Sub-50ms query)
export const getCachedInsightsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1. Fetch Accounts with Categories
    const { data: accounts, error: accErr } = await supabase
      .from("instagram_accounts")
      .select(`
        id,
        username,
        category_id,
        hidden,
        created_at,
        account_categories(id, name, color)
      `)
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
      .select(`
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
        instagram_accounts(username, account_categories(name, color))
      `)
      .in("instagram_account_id", accountIds)
      .order("views_count", { ascending: false })
      .limit(12);

    if (mediaErr) throw mediaErr;

    const insightsMap = new Map((insightsData || []).map((ins) => [ins.instagram_account_id, ins]));

    const accountsWithInsights = accounts.map((acc) => {
      const ins = insightsMap.get(acc.id);
      return {
        ...acc,
        insights: ins || null,
        followersCount: ins?.followers_count ?? 0,
        totalViews: ins?.total_views ?? 0,
        totalReach: ins?.total_reach ?? 0,
        totalLikes: ins?.total_likes ?? 0,
        totalComments: ins?.total_comments ?? 0,
        totalShares: ins?.total_shares ?? 0,
        totalSaved: ins?.total_saved ?? 0,
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
