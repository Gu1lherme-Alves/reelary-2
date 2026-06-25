import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const results = {
      processed: 0,
      published: 0,
      skipped: 0,
      errors: [] as string[],
      timestamp: new Date().toISOString(),
    };

    // Fetch pending posts that are due
    const { data: posts, error: fetchErr } = await supabase
      .from("scheduled_posts")
      .select(
        `id, video_url, caption, scheduled_at, ig_container_id, cover_url,
         instagram_accounts!inner(instagram_user_id, access_token, username)`,
      )
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5);

    if (fetchErr) {
      console.error("DB fetch error:", fetchErr);
      return Response.json({ ...results, errors: [`DB: ${fetchErr.message}`] }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      console.log("No pending posts due for publishing.");
      return Response.json(results);
    }

    console.log(`Found ${posts.length} pending post(s) to process.`);

    for (const post of posts) {
      results.processed++;
      const ig = (post as any).instagram_accounts;

      if (!ig?.access_token || !ig?.instagram_user_id) {
        const msg = "Conta Instagram desconectada ou sem token.";
        await supabase
          .from("scheduled_posts")
          .update({ status: "failed", error_message: msg })
          .eq("id", post.id);
        results.errors.push(`Post ${post.id}: ${msg}`);
        continue;
      }

      const graphApiUrl = ig.access_token.startsWith("IGAA")
        ? "https://graph.instagram.com/v21.0"
        : "https://graph.facebook.com/v21.0";

      try {
        let containerId = post.ig_container_id;

        // ════════════════════════════════════════════
        // PHASE 1: Create media container (if needed)
        // ════════════════════════════════════════════
        if (!containerId) {
          console.log(`[${post.id}] Creating media container for @${ig.username}...`);

          const body: any = {
            video_url: post.video_url,
            caption: post.caption,
            media_type: "REELS",
            access_token: ig.access_token,
          };

          if (post.cover_url) {
            console.log(`[${post.id}] Using custom cover image: ${post.cover_url}`);
            body.cover_url = post.cover_url;
          }

          const createRes = await fetch(`${graphApiUrl}/${ig.instagram_user_id}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!createRes.ok) {
            const errBody = await createRes.text();
            throw new Error(`Container creation failed (${createRes.status}): ${errBody}`);
          }

          const createData = await createRes.json();
          containerId = createData.id;
          console.log(`[${post.id}] Container created: ${containerId}`);

          // Save container ID immediately so we don't re-create on retry
          await supabase
            .from("scheduled_posts")
            .update({ ig_container_id: containerId })
            .eq("id", post.id);
        }

        // ════════════════════════════════════════════
        // PHASE 2: Check container status (with direct publish fallback)
        // ════════════════════════════════════════════
        let shouldPublish = false;
        let isProcessing = false;

        console.log(`[${post.id}] Checking container ${containerId} status...`);
        try {
          const statusRes = await fetch(
            `${graphApiUrl}/${containerId}?fields=status_code&access_token=${encodeURIComponent(ig.access_token)}`,
          );

          if (!statusRes.ok) {
            const errBody = await statusRes.text();
            throw new Error(`Status check returned ${statusRes.status}: ${errBody}`);
          }

          const statusData = await statusRes.json();
          console.log(`[${post.id}] Container status: ${statusData.status_code}`);

          if (statusData.status_code === "ERROR") {
            throw new Error(`Instagram rejected the video: ${JSON.stringify(statusData)}`);
          } else if (statusData.status_code === "FINISHED") {
            shouldPublish = true;
          } else {
            // Still processing
            isProcessing = true;
          }
        } catch (statusErr: any) {
          // If status check fails (due to known Meta bug e.g. subcode 33), we fallback to direct publish attempt!
          console.warn(
            `[${post.id}] Status check failed. Attempting direct publish fallback. Error: ${statusErr.message}`,
          );
          shouldPublish = true; // Attempt to publish and let media_publish handle the state
        }

        if (isProcessing) {
          console.log(`[${post.id}] Still processing (reported by API), will retry next run.`);
          results.skipped++;
          continue;
        }

        // ════════════════════════════════════════════
        // PHASE 3: Publish the Reel!
        // ════════════════════════════════════════════
        if (shouldPublish) {
          console.log(`[${post.id}] Publishing reel to @${ig.username}...`);
          const pubRes = await fetch(`${graphApiUrl}/${ig.instagram_user_id}/media_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              creation_id: containerId,
              access_token: ig.access_token,
            }),
          });

          if (!pubRes.ok) {
            const errBody = await pubRes.text();
            let parsedErr: any = null;
            try {
              parsedErr = JSON.parse(errBody);
            } catch (_) {
              // ignore parse errors
            }

            const subcode = parsedErr?.error?.error_subcode;
            const message = parsedErr?.error?.message ?? "";

            // Check for "Media is not ready" error subcode 2207027 or text pattern
            if (
              subcode === 2207027 ||
              message.toLowerCase().includes("not ready") ||
              errBody.includes("2207027")
            ) {
              console.log(`[${post.id}] Video is still processing on Meta. Retrying on next run.`);
              results.skipped++;
              continue;
            }

            throw new Error(`Publish failed (${pubRes.status}): ${errBody}`);
          }

          const pubData = await pubRes.json();
          console.log(`[${post.id}] ✅ Published! Media ID: ${pubData.id}`);

          // Mark as published
          await supabase
            .from("scheduled_posts")
            .update({
              status: "published",
              published_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("id", post.id);

          results.published++;
        }
      } catch (err: any) {
        const msg = (err?.message ?? String(err)).slice(0, 500);
        console.error(`[${post.id}] ❌ Error: ${msg}`);

        await supabase
          .from("scheduled_posts")
          .update({ status: "failed", error_message: msg })
          .eq("id", post.id);

        results.errors.push(`Post ${post.id}: ${msg}`);
      }
    }

    console.log(
      `Done. Processed: ${results.processed}, Published: ${results.published}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`,
    );
    return Response.json(results);
  } catch (err: any) {
    console.error("Fatal error in publish-reels:", err);
    return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
});
