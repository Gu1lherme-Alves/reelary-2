import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "npm:@aws-sdk/client-s3";

function getS3Client() {
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn("R2 credentials not set in Deno environment.");
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getR2KeyFromUrl(url: string | null, publicDomain: string | null): string | null {
  if (!url) return null;
  if (publicDomain) {
    const domainPrefix = publicDomain.endsWith("/") ? publicDomain : `${publicDomain}/`;
    if (url.startsWith(domainPrefix)) {
      return decodeURIComponent(url.substring(domainPrefix.length));
    }
  }
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname.substring(1));
  } catch (_) {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const urlObj = new URL(req.url);
    const action = urlObj.searchParams.get("action");
    if (action === "delete_today") {
      console.log("Delete today action triggered!");
      
      const startOfDay = "2026-07-06T00:00:00.000Z";
      const endOfDay = "2026-07-07T00:00:00.000Z";
      
      const { data: posts, error: fetchErr } = await supabase
        .from("scheduled_posts")
        .select("video_url, cover_url")
        .gte("scheduled_at", startOfDay)
        .lt("scheduled_at", endOfDay);
        
      if (fetchErr) {
        console.error("Failed to fetch today's posts:", fetchErr);
        return Response.json({ error: fetchErr.message }, { status: 500 });
      }
      
      const r2PublicDomain = Deno.env.get("R2_PUBLIC_DOMAIN") ?? null;
      const r2BucketName = Deno.env.get("R2_BUCKET_NAME") ?? "reels";
      const s3 = getS3Client();

      const keysToDelete: string[] = [];
      if (posts) {
        for (const post of posts) {
          const videoKey = getR2KeyFromUrl(post.video_url, r2PublicDomain);
          if (videoKey) keysToDelete.push(videoKey);
          const coverKey = getR2KeyFromUrl(post.cover_url, r2PublicDomain);
          if (coverKey) keysToDelete.push(coverKey);
        }
      }
      
      let storageResult: any = null;
      if (keysToDelete.length > 0 && s3) {
        console.log("Deleting R2 files:", keysToDelete);
        let deletedCount = 0;
        const deleteErrors: string[] = [];
        for (const key of keysToDelete) {
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
            deletedCount++;
          } catch (err: any) {
            console.error(`R2 delete error for ${key}:`, err);
            deleteErrors.push(err.message);
          }
        }
        storageResult = { success: true, deletedCount, errors: deleteErrors.length > 0 ? deleteErrors : undefined };
      } else {
        storageResult = { deletedCount: 0 };
      }
      
      const { error: dbErr } = await supabase
        .from("scheduled_posts")
        .delete()
        .gte("scheduled_at", startOfDay)
        .lt("scheduled_at", endOfDay);
        
      if (dbErr) {
        console.error("Database delete error:", dbErr);
        return Response.json({ error: dbErr.message, storageResult }, { status: 500 });
      }
      
      return Response.json({ success: true, storageResult, message: "Deleted today's posts and storage files successfully" });
    }

    if (action === "cleanup_orphans") {
      console.log("Cleanup orphans action triggered!");
      
      const r2PublicDomain = Deno.env.get("R2_PUBLIC_DOMAIN") ?? null;
      const r2BucketName = Deno.env.get("R2_BUCKET_NAME") ?? "reels";
      const s3 = getS3Client();

      if (!s3) {
        return Response.json({ error: "R2 credentials not configured" }, { status: 500 });
      }

      // 1. List all objects in R2 bucket
      const r2Files: string[] = [];
      let continuationToken: string | undefined;
      do {
        const listResult = await s3.send(new ListObjectsV2Command({
          Bucket: r2BucketName,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        }));
        if (listResult.Contents) {
          for (const obj of listResult.Contents) {
            if (obj.Key) r2Files.push(obj.Key);
          }
        }
        continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined;
      } while (continuationToken);
      
      // 2. Get all referenced files from DB
      const { data: posts, error: postsErr } = await supabase
        .from("scheduled_posts")
        .select("video_url, cover_url");
        
      if (postsErr) {
        console.error("Failed to fetch posts:", postsErr);
        return Response.json({ error: postsErr.message }, { status: 500 });
      }
      
      const activeKeys = new Set<string>();
      if (posts) {
        for (const post of posts) {
          const videoKey = getR2KeyFromUrl(post.video_url, r2PublicDomain);
          if (videoKey) activeKeys.add(videoKey);
          const coverKey = getR2KeyFromUrl(post.cover_url, r2PublicDomain);
          if (coverKey) activeKeys.add(coverKey);
        }
      }
      
      const orphanedFiles = r2Files.filter((key) => key && !activeKeys.has(key));
      console.log(`Found ${orphanedFiles.length} orphaned R2 files to delete.`);
      
      const deleted: string[] = [];
      const errors: string[] = [];
      
      for (const key of orphanedFiles) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: key }));
          deleted.push(key);
        } catch (err: any) {
          console.error(`R2 delete error for ${key}:`, err);
          errors.push(`${key}: ${err.message}`);
        }
      }
      
      return Response.json({
        success: true,
        totalOrphaned: orphanedFiles.length,
        deletedCount: deleted.length,
        deletedFiles: deleted,
        errors: errors.length > 0 ? errors : undefined
      });
    }





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
      .limit(50);

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

          // Mark as published and clear video/cover URLs
          await supabase
            .from("scheduled_posts")
            .update({
              status: "published",
              published_at: new Date().toISOString(),
              error_message: null,
              video_url: "",
              cover_url: null,
            })
            .eq("id", post.id);

          results.published++;

          // Delete files from R2 only if they are not referenced by any other post
          try {
            const r2PublicDomain = Deno.env.get("R2_PUBLIC_DOMAIN") ?? null;
            const r2BucketName = Deno.env.get("R2_BUCKET_NAME") ?? "reels";
            const s3 = getS3Client();

            if (s3) {
              const videoKey = getR2KeyFromUrl(post.video_url, r2PublicDomain);
              if (videoKey) {
                const { data: videoRefs } = await supabase
                  .from("scheduled_posts")
                  .select("id")
                  .eq("video_url", post.video_url)
                  .neq("id", post.id);
                  
                if (!videoRefs || videoRefs.length === 0) {
                  console.log(`[${post.id}] Deleting video from R2 (no other references): ${videoKey}`);
                  await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: videoKey }));
                } else {
                  console.log(`[${post.id}] Skipping video deletion, still referenced by ${videoRefs.length} other post(s).`);
                }
              }

              const coverKey = getR2KeyFromUrl(post.cover_url, r2PublicDomain);
              if (coverKey) {
                const { data: coverRefs } = await supabase
                  .from("scheduled_posts")
                  .select("id")
                  .eq("cover_url", post.cover_url)
                  .neq("id", post.id);
                  
                if (!coverRefs || coverRefs.length === 0) {
                  console.log(`[${post.id}] Deleting cover from R2 (no other references): ${coverKey}`);
                  await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: coverKey }));
                } else {
                  console.log(`[${post.id}] Skipping cover deletion, still referenced by ${coverRefs.length} other post(s).`);
                }
              }
            } else {
              console.warn(`[${post.id}] R2 credentials not set, skipping storage cleanup.`);
            }
          } catch (storageErr) {
            console.error(`[${post.id}] Error deleting R2 files:`, storageErr);
          }
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
