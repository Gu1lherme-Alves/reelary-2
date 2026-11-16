import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "npm:@aws-sdk/client-s3";

function getS3Client() {
  let accountId = Deno.env.get("R2_ACCOUNT_ID") || "77c3070b55347939beac6ee268951f4e";
  if (accountId && accountId.includes("8ee2")) {
    accountId = accountId.replace("8ee2", "6ee2");
  }
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID") || "a9b3b10bddf542260c98835a286a793b";
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY") || "42a34710a37a6356dcace841d6f9c28c0828178f1b717e588f46f1d328cfada3";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn("R2 credentials not set in Deno environment.");
    return null;
  }

  return new S3Client({
    region: "us-east-1",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    s3ForcePathStyle: true,
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
        storageResult = {
          success: true,
          deletedCount,
          errors: deleteErrors.length > 0 ? deleteErrors : undefined,
        };
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

      return Response.json({
        success: true,
        storageResult,
        message: "Deleted today's posts and storage files successfully",
      });
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
        const listResult = await s3.send(
          new ListObjectsV2Command({
            Bucket: r2BucketName,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          }),
        );
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
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    const results = {
      processed: 0,
      published: 0,
      skipped: 0,
      errors: [] as string[],
      timestamp: new Date().toISOString(),
    };

    // Fetch pending posts that are due using the atomic grab and lock function
    // Process up to 100 distinct accounts concurrently across multiple cron triggers
    const { data: posts, error: fetchErr } = await supabase.rpc("grab_pending_posts_to_publish", {
      limit_count: 100,
    });

    if (fetchErr) {
      console.error("DB fetch error:", fetchErr);
      results.errors.push(`DB: ${fetchErr.message}`);
      return Response.json(results, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      console.log("No pending posts due for publishing.");
      return Response.json(results);
    }

    // ─── CADÊNCIA ORGÂNICA ANTI-SPAM (MÁXIMO 1 POST POR CONTA POR CICLO) ──────────
    // Evita o disparo simultâneo de múltiplos vídeos no mesmo segundo para a mesma conta,
    // que aciona o filtro anti-flood da Meta, derruba a legenda e zera o alcance (0 views).
    // Contas diferentes continuam rodando em paralelo, mas cada conta publica 1 vídeo
    // por minuto (ciclo do cron), garantindo cadência 100% natural.
    const accountQueues = new Map<string, typeof posts>();
    for (const post of posts) {
      const accId = (post as any).instagram_account_id;
      if (!accountQueues.has(accId)) accountQueues.set(accId, []);
      accountQueues.get(accId)!.push(post);
    }

    const postsToProcess: typeof posts = [];
    const postsToUnlockIds: string[] = [];

    for (const [_accId, accPosts] of accountQueues.entries()) {
      postsToProcess.push(accPosts[0]);
      if (accPosts.length > 1) {
        for (let i = 1; i < accPosts.length; i++) {
          postsToUnlockIds.push(accPosts[i].id);
        }
      }
    }

    if (postsToUnlockIds.length > 0) {
      await supabase
        .from("scheduled_posts")
        .update({ locked_at: null })
        .in("id", postsToUnlockIds);
    }

    console.log(
      `Processing paced batch: ${postsToProcess.length} conta(s) distintas em paralelo (1 post/conta). ${postsToUnlockIds.length} post(s) preservados para os próximos ciclos de 1 min.`,
    );

    await Promise.allSettled(
      postsToProcess.map(async (post) => {
        results.processed++;
        const ig = {
          instagram_user_id: (post as any).instagram_user_id,
          access_token: (post as any).access_token,
          username: (post as any).username,
        };

        if (!ig.access_token || !ig.instagram_user_id) {
          const msg = "Conta Instagram desconectada ou sem token.";
          const { data: updatedPost } = await supabase
            .from("scheduled_posts")
            .update({ status: "failed", error_message: msg, locked_at: null })
            .eq("id", post.id)
            .select("instagram_account_id")
            .single();

          if (updatedPost?.instagram_account_id) {
            await supabase
              .from("instagram_accounts")
              .update({ token_invalid: true })
              .eq("id", updatedPost.instagram_account_id);
          }

          results.errors.push(`Post ${post.id}: ${msg}`);
          return;
        }

        const graphApiUrl = ig.access_token.startsWith("IG")
          ? "https://graph.instagram.com/v21.0"
          : "https://graph.facebook.com/v21.0";

        // Proxy Residencial Dedicado (Multi-tenant por usuário):
        // Cada usuário pode cadastrar seu próprio proxy na aba 'Proxy' ou usar a configuração padrão.
        const proxyHost = (post as any).proxy_host || Deno.env.get("RESIDENTIAL_PROXY_HOST") || "sv2.allanproxys.com";
        const proxyUser = (post as any).proxy_username || Deno.env.get("RESIDENTIAL_PROXY_USER") || "26769afd5b916fcb3787";
        const proxyPass = (post as any).proxy_password || Deno.env.get("RESIDENTIAL_PROXY_PASS") || "fe412ef49294f1de";
        const proxyEnabled = (post as any).proxy_enabled !== false;

        const primaryPort = (post as any).proxy_port && Number((post as any).proxy_port) >= 10000
          ? Number((post as any).proxy_port)
          : 11000;

        // Monta a lista de portas candidatas:
        // 1. A porta residencial primária da conta
        // 2. Fallbacks na faixa de reserva (18000 a 19000) para nunca colidir com outra conta
        const candidatePorts: number[] = [primaryPort];
        // Reserva dinâmica exclusiva: hash determinístico baseado no ID do post/conta para dispersão
        const reserveBase = 18000 + (Math.abs(primaryPort * 31) % 1000);
        candidatePorts.push(reserveBase);
        candidatePorts.push(18000 + Math.floor(Math.random() * 1000));

        let proxyPort = primaryPort;
        let proxyClient: any = undefined;

        if (proxyEnabled && proxyUser && proxyPass) {
          for (const tryPort of candidatePorts) {
            const tryUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${tryPort}`;
            const tryClient = (Deno as any).createHttpClient?.({ proxy: { url: tryUrl } });
            try {
              const testRes = await fetch("https://httpbin.org/ip", {
                ...(tryClient ? { client: tryClient } : {}),
                signal: AbortSignal.timeout(2500),
              });
              if (testRes.ok) {
                proxyPort = tryPort;
                proxyClient = tryClient;
                console.log(`[${post.id}] Proxy Residencial OK: porta ${tryPort} (${tryPort === primaryPort ? "porta primária dedicada" : "reserva dinâmica"}) selecionada para @${ig.username}`);
                break;
              }
            } catch (_) {
              console.warn(`[${post.id}] Porta residencial ${tryPort} não respondeu em 2.5s, testando reserva...`);
            }
          }

          if (!proxyClient) {
            const errMsg = `Proxy residencial (${proxyHost}) não respondeu ou franquia esgotada. Post pausado para evitar entrega zero via IP de datacenter.`;
            console.error(`[${post.id}] ${errMsg}`);
            await supabase
              .from("scheduled_posts")
              .update({
                status: "failed",
                error_message: errMsg,
                locked_at: null,
              })
              .eq("id", post.id);
            results.errors.push(`Post ${post.id}: ${errMsg}`);
            return;
          }
        }

        try {
          let containerId = post.ig_container_id;

          // ════════════════════════════════════════════
          // PHASE 1: Create media container (if needed)
          // ════════════════════════════════════════════
          if (!containerId) {
            console.log(`[${post.id}] Creating media container for @${ig.username}... (Proxy: ${proxyClient ? `port ${proxyPort}` : "NONE"})`);
            console.log(`[${post.id}] CAPTION RAW (${(post.caption || "").length} chars): ${JSON.stringify((post.caption || "").substring(0, 150))}...`);

            // Use URLSearchParams (application/x-www-form-urlencoded) for 100% reliable UTF-8 caption & metadata delivery to Meta
            const containerParams = new URLSearchParams();
            containerParams.set("media_type", "REELS");
            containerParams.set("video_url", post.video_url);
            containerParams.set("access_token", ig.access_token);
            containerParams.set("share_to_feed", "true");

            if (post.caption) {
              containerParams.set("caption", post.caption);
              console.log(`[${post.id}] Caption attached (${post.caption.length} chars)`);
            } else {
              console.warn(`[${post.id}] WARNING: post.caption is empty or falsy!`);
            }

            if (post.cover_url && typeof post.cover_url === "string" && post.cover_url.trim().length > 0) {
              containerParams.set("cover_url", post.cover_url.trim());
              console.log(`[${post.id}] Cover URL attached: ${post.cover_url}`);
            }

            console.log(`[${post.id}] Creating container via URLSearchParams with caption (${(post.caption || "").length} chars) and share_to_feed=true`);

            const createRes = await fetch(`${graphApiUrl}/${ig.instagram_user_id}/media`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
                "Accept": "application/json",
              },
              body: containerParams.toString(),
              ...(proxyClient ? { client: proxyClient } : {}),
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
              .update({ ig_container_id: containerId, updated_at: new Date().toISOString() })
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
              {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  "Accept": "application/json",
                },
                ...(proxyClient ? { client: proxyClient } : {}),
              },
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
              // Wait 4 seconds after container status reaches FINISHED to allow Meta's CDN to firmly index the caption text before publishing
              console.log(`[${post.id}] Container FINISHED. Waiting 4s buffer for Meta caption indexing...`);
              await new Promise((resolve) => setTimeout(resolve, 4000));
              shouldPublish = true;
            } else if (statusData.status_code === "PUBLISHED") {
              console.log(`[${post.id}] Reel already published on Instagram. Updating DB status...`);
              await supabase
                .from("scheduled_posts")
                .update({
                  status: "published",
                  published_at: new Date().toISOString(),
                  error_message: null,
                  video_url: "",
                  cover_url: null,
                  locked_at: null,
                })
                .eq("id", post.id);

              results.published++;
              return;
            } else if (statusData.status_code === "EXPIRED") {
              console.log(`[${post.id}] Container expired. Resetting ig_container_id to retry.`);
              await supabase
                .from("scheduled_posts")
                .update({ ig_container_id: null, locked_at: null, updated_at: new Date().toISOString() })
                .eq("id", post.id);

              results.skipped++;
              return;
            } else {
              // Still processing (IN_PROGRESS)
              // Auto-recover if stuck in IN_PROGRESS for more than 10 minutes
              const postUpdatedAt = (post as any).updated_at ? new Date((post as any).updated_at).getTime() : 0;
              const isStuck = postUpdatedAt > 0 && (Date.now() - postUpdatedAt > 10 * 60 * 1000);
              if (isStuck) {
                console.warn(`[${post.id}] Container ${containerId} stuck in IN_PROGRESS for >10min. Resetting to recreate fresh.`);
                await supabase
                  .from("scheduled_posts")
                  .update({ ig_container_id: null, locked_at: null, updated_at: new Date().toISOString() })
                  .eq("id", post.id);
                results.skipped++;
                return;
              }
              isProcessing = true;
            }
          } catch (statusErr: any) {
            console.warn(
              `[${post.id}] Status check failed: ${statusErr.message}`,
            );
            const errMsg = statusErr?.message ?? "";
            // Only fallback to direct publish if it's an explicit Meta container query bug, NOT a proxy/network failure!
            if (errMsg.includes("33") || errMsg.includes("Unsupported get request")) {
              console.log(`[${post.id}] Known Meta container query bug detected. Attempting direct publish fallback.`);
              shouldPublish = true;
            } else {
              console.log(`[${post.id}] Transient network or status check error, will retry on next run.`);
              isProcessing = true;
            }
          }

          if (isProcessing) {
            console.log(`[${post.id}] Still processing (reported by API), will retry next run.`);
            // Unlock the post so the next run can check it again
            await supabase.from("scheduled_posts").update({ locked_at: null }).eq("id", post.id);

            results.skipped++;
            return;
          }

        // ════════════════════════════════════════════
        // PHASE 3: Publish the Reel!
        // ════════════════════════════════════════════
        if (shouldPublish) {
          console.log(`[${post.id}] Publishing reel to @${ig.username}...`);

          const publishParams = new URLSearchParams();
          publishParams.set("creation_id", containerId);
          publishParams.set("access_token", ig.access_token);

          const pubRes = await fetch(`${graphApiUrl}/${ig.instagram_user_id}/media_publish`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
              "Accept": "application/json",
            },
            body: publishParams.toString(),
            ...(proxyClient ? { client: proxyClient } : {}),
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
              // Unlock the post so the next run can check it again
              await supabase.from("scheduled_posts").update({ locked_at: null }).eq("id", post.id);

              results.skipped++;
              return;
            }

            throw new Error(`Publish failed (${pubRes.status}): ${errBody}`);
          }

          const pubData = await pubRes.json();
          const publishedMediaId = pubData.id;
          console.log(`[${post.id}] ✅ Published! Media ID: ${publishedMediaId}`);

          // ════════════════════════════════════════════
          // PHASE 4: Verify caption was indexed & auto-fix if dropped
          // ════════════════════════════════════════════
          if (post.caption && publishedMediaId) {
            try {
              // Wait 2 seconds for Meta's CDN to finalize metadata
              await new Promise((r) => setTimeout(r, 2000));
              const verifyRes = await fetch(
                `${graphApiUrl}/${publishedMediaId}?fields=caption&access_token=${encodeURIComponent(ig.access_token)}`,
                {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                  },
                  ...(proxyClient ? { client: proxyClient } : {}),
                },
              );

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                const publishedCaption = (verifyData.caption ?? "").trim();
                if (!publishedCaption || publishedCaption.length < 5) {
                  console.warn(`[${post.id}] ⚠️ Caption was DROPPED by Meta! Restoring caption via API update...`);
                  const updateParams = new URLSearchParams();
                  updateParams.set("caption", post.caption);
                  updateParams.set("access_token", ig.access_token);

                  const updateRes = await fetch(`${graphApiUrl}/${publishedMediaId}`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
                      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                      "Accept": "application/json",
                    },
                    body: updateParams.toString(),
                    ...(proxyClient ? { client: proxyClient } : {}),
                  });

                  if (updateRes.ok) {
                    console.log(`[${post.id}] ✅ Caption successfully restored via direct API update!`);
                  } else {
                    const errText = await updateRes.text().catch(() => "");
                    console.warn(`[${post.id}] Direct caption update failed (${updateRes.status}): ${errText}`);
                  }
                } else {
                  console.log(`[${post.id}] ✅ Caption verified OK on Instagram (${publishedCaption.length} chars).`);
                }
              }
            } catch (verifyErr: any) {
              console.warn(`[${post.id}] Caption verification check non-fatal error: ${verifyErr.message}`);
            }
          }

          // Mark as published, clear video/cover URLs and reset locked_at
          await supabase
            .from("scheduled_posts")
            .update({
              status: "published",
              published_at: new Date().toISOString(),
              error_message: null,
              video_url: "",
              cover_url: null,
              locked_at: null,
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

                if (videoRefs && videoRefs.length === 0) {
                  console.log(
                    `[${post.id}] Deleting video from R2 (no other references): ${videoKey}`,
                  );
                  await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: videoKey }));
                } else {
                  console.log(
                    `[${post.id}] Skipping video deletion, still referenced by ${videoRefs?.length ?? 0} other post(s).`,
                  );
                }
              }

              const coverKey = getR2KeyFromUrl(post.cover_url, r2PublicDomain);
              if (coverKey) {
                const { data: coverRefs } = await supabase
                  .from("scheduled_posts")
                  .select("id")
                  .eq("cover_url", post.cover_url)
                  .neq("id", post.id);

                if (coverRefs && coverRefs.length === 0) {
                  console.log(
                    `[${post.id}] Deleting cover from R2 (no other references): ${coverKey}`,
                  );
                  await s3.send(new DeleteObjectCommand({ Bucket: r2BucketName, Key: coverKey }));
                } else {
                  console.log(
                    `[${post.id}] Skipping cover deletion, still referenced by ${coverRefs?.length ?? 0} other post(s).`,
                  );
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

        let isTokenExpired = false;
        let isPermanentError = false;
        let isRateLimitExceeded = false;

        try {
          // Meta errors are thrown with a JSON string inside the message.
          // Example: "Publish failed (500): {\"error\":...}"
          const jsonStart = msg.indexOf("{");
          if (jsonStart !== -1) {
            const jsonStr = msg.slice(jsonStart);
            const errorObj = JSON.parse(jsonStr);
            const metaError = errorObj?.error;

            if (metaError) {
              const code = metaError.code;
              const subcode = metaError.error_subcode;
              const message = (metaError.message ?? "").toLowerCase();
              const isTransient = metaError.is_transient ?? false;

              // Check for Meta 50 reels/24h rate limit
              if (
                subcode === 2207042 ||
                message.includes("media publish limit exceeded") ||
                message.includes("limite de publicação de mídia excedido") ||
                message.includes("maximum number of posts that is allowed")
              ) {
                isRateLimitExceeded = true;
              }

              // Check for permanent user content errors (e.g. caption too long, missing 404 video)
              if (
                code === 36004 ||
                subcode === 2207010 ||
                subcode === 2207076 ||
                message.includes("caption was too long") ||
                message.includes("media download has failed") ||
                message.includes("404")
              ) {
                isPermanentError = true;
              }

              if (!isTransient && !isRateLimitExceeded) {
                isTokenExpired =
                  code === 190 ||
                  code === 102 ||
                  [458, 460, 463, 467, 490].includes(subcode) ||
                  message.includes("access token") ||
                  message.includes("session has expired") ||
                  message.includes("checkpoint") ||
                  message.includes("login to www.instagram.com");
              }
            }
          }
        } catch (_) {
          const errorLower = msg.toLowerCase();
          if (errorLower.includes("2207042") || errorLower.includes("media publish limit exceeded")) {
            isRateLimitExceeded = true;
          } else {
            isTokenExpired =
              errorLower.includes("session has expired") ||
              errorLower.includes("checkpoint") ||
              errorLower.includes("login to www.instagram.com") ||
              errorLower.includes("invalid access token") ||
              errorLower.includes("token has expired") ||
              (errorLower.includes("190") && !errorLower.includes('is_transient":true'));
          }
        }

        const accountId = (post as any).instagram_account_id;

        if (isRateLimitExceeded) {
          console.warn(
            `[${post.id}] ⚠️ Conta @${ig.username} atingiu o limite de 50 posts/24h da Meta (2207042). Reagendando todos os posts pendentes da conta para daqui a 24h.`,
          );
          const postponeTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          if (accountId) {
            await supabase
              .from("scheduled_posts")
              .update({
                scheduled_at: postponeTime,
                locked_at: null,
                retry_count: 0,
                error_message: "[Meta Rate Limit 50/dia]: Limite diário de publicação atingido. Reagendado para daqui a 24h.",
              })
              .eq("instagram_account_id", accountId)
              .eq("status", "pending");
          }
          results.errors.push(`Post ${post.id}: Limite diário da Meta atingido (50 posts/dia). Conta postergada por 24h.`);
        } else if (isTokenExpired) {
          console.log(
            `[${post.id}] Token is expired or invalid. Marking account as token_invalid.`,
          );
          if (accountId) {
            await supabase
              .from("instagram_accounts")
              .update({ token_invalid: true })
              .eq("id", accountId);
          }
          await supabase
            .from("scheduled_posts")
            .update({ status: "failed", error_message: msg, locked_at: null })
            .eq("id", post.id);

          results.errors.push(`Post ${post.id}: ${msg}`);
        } else if (isPermanentError) {
          console.warn(
            `[${post.id}] Erro permanente detectado no conteúdo do post. Marcando como falha.`,
          );
          await supabase
            .from("scheduled_posts")
            .update({ status: "failed", error_message: msg, locked_at: null })
            .eq("id", post.id);

          results.errors.push(`Post ${post.id}: ${msg}`);
        } else {
          // Conta ativa / erro transitório (download de vídeo pela Meta, 500, timeout, rede, etc.)
          const currentRetries = Number((post as any).retry_count ?? 0);
          const MAX_RETRIES = 3;

          if (currentRetries < MAX_RETRIES) {
            const nextRetry = currentRetries + 1;
            // Delay suave: 1 min na tentativa 1, 2 min na tentativa 2, 3 min na tentativa 3
            const delayMinutes = nextRetry;
            const nextScheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

            console.log(
              `[${post.id}] ⚠️ Erro transitório em conta ativa (@${ig.username}). Tentativa ${nextRetry}/${MAX_RETRIES} reagendada para ${nextScheduledAt}.`,
            );

            await supabase
              .from("scheduled_posts")
              .update({
                status: "pending",
                retry_count: nextRetry,
                ig_container_id: null, // Limpa o container antigo com erro para a Meta recriar e baixar novamente
                scheduled_at: nextScheduledAt,
                locked_at: null,
                error_message: `[Tentativa ${nextRetry}/${MAX_RETRIES}]: ${msg}. Reagendado automaticamente.`,
              })
              .eq("id", post.id);

            results.errors.push(`Post ${post.id} (reagendado ${nextRetry}/${MAX_RETRIES}): ${msg}`);
          } else {
            console.error(
              `[${post.id}] ❌ Limite máximo de ${MAX_RETRIES} tentativas atingido para este post. Marcando como falha final.`,
            );

            await supabase
              .from("scheduled_posts")
              .update({
                status: "failed",
                locked_at: null,
                error_message: `[Falha final após ${MAX_RETRIES} tentativas]: ${msg}`,
              })
              .eq("id", post.id);

            results.errors.push(`Post ${post.id} (falha final após ${MAX_RETRIES} tentativas): ${msg}`);
          }
        }
      }
    })
  );

    console.log(
      `Done. Processed: ${results.processed}, Published: ${results.published}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`,
    );
    return Response.json(results);
  } catch (err: any) {
    console.error("Fatal error in publish-reels:", err);
    return Response.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
});
