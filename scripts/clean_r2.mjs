import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Carrega variáveis de ambiente manualmente de .env
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const accountId = envVars.R2_ACCOUNT_ID;
const accessKeyId = envVars.R2_ACCESS_KEY_ID;
const secretAccessKey = envVars.R2_SECRET_ACCESS_KEY;
const bucketName = envVars.R2_BUCKET_NAME || "reels";
const publicDomain = envVars.R2_PUBLIC_DOMAIN || "";
const supabaseUrl = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_PUBLISHABLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("❌ Credenciais do Cloudflare R2 ausentes no .env!");
  process.exit(1);
}

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const supabase = createClient(supabaseUrl, supabaseKey);

function getR2KeyFromUrl(url) {
  if (!url) return null;
  const normalizedDomain = publicDomain.endsWith("/") ? publicDomain.slice(0, -1) : publicDomain;
  if (url.startsWith(normalizedDomain)) {
    return decodeURIComponent(url.substring(normalizedDomain.length + 1));
  }
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.substring(1));
  } catch (_) {
    return null;
  }
}

async function runCleanup() {
  console.log("==================================================");
  console.log("🧹 INICIANDO LIMPEZA DE ARQUIVOS INÚTEIS NO CLOUDFLARE R2");
  console.log("Bucket:", bucketName);
  console.log("==================================================");

  // 1. Buscar todos os arquivos referenciados em posts PENDENTES
  console.log("\n1️⃣ Buscando posts agendados ativos no Supabase...");
  const { data: pendingPosts, error: dbErr } = await supabase
    .from("scheduled_posts")
    .select("id, video_url, cover_url")
    .eq("status", "pending");

  if (dbErr) {
    throw new Error(`Erro ao buscar posts no Supabase: ${dbErr.message}`);
  }

  const activeKeys = new Set();
  for (const post of pendingPosts || []) {
    const vk = getR2KeyFromUrl(post.video_url);
    if (vk) activeKeys.add(vk);
    const ck = getR2KeyFromUrl(post.cover_url);
    if (ck) activeKeys.add(ck);
  }

  console.log(`✅ Posts pendentes encontrados: ${pendingPosts?.length || 0}`);
  console.log(`🔒 Chaves ativas preservadas (vídeos e capas necessários): ${activeKeys.size}`);

  // 2. Listar todos os objetos no bucket R2
  console.log("\n2️⃣ Listando arquivos no Cloudflare R2...");
  const allObjects = [];
  let totalBytes = 0;
  let continuationToken = undefined;

  do {
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    if (listRes.Contents) {
      for (const obj of listRes.Contents) {
        if (obj.Key) {
          allObjects.push({ key: obj.Key, size: obj.Size || 0 });
          totalBytes += obj.Size || 0;
        }
      }
    }
    continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
  } while (continuationToken);

  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`📦 Total de arquivos no R2: ${allObjects.length} (${totalMB} MB)`);

  // 3. Filtrar arquivos inúteis / órfãos
  const orphanedObjects = allObjects.filter((obj) => !activeKeys.has(obj.key));
  const orphanedBytes = orphanedObjects.reduce((acc, obj) => acc + obj.size, 0);
  const orphanedMB = (orphanedBytes / (1024 * 1024)).toFixed(2);

  console.log(`\n3️⃣ Arquivos órfãos/inúteis identificados: ${orphanedObjects.length} (${orphanedMB} MB)`);

  if (orphanedObjects.length === 0) {
    console.log("✨ Nenhum arquivo inútil encontrado! Seu Cloudflare R2 já está 100% limpo.");
    return;
  }

  // 4. Excluir em lotes de até 1000 arquivos (limite do DeleteObjectsCommand da AWS S3 API)
  console.log(`\n4️⃣ Removendo ${orphanedObjects.length} arquivos inúteis do R2...`);
  const BATCH_SIZE = 1000;
  let deletedCount = 0;

  for (let i = 0; i < orphanedObjects.length; i += BATCH_SIZE) {
    const chunk = orphanedObjects.slice(i, i + BATCH_SIZE);
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: chunk.map((c) => ({ Key: c.key })),
        Quiet: true,
      },
    };

    const delRes = await s3.send(new DeleteObjectsCommand(deleteParams));
    if (delRes.Errors && delRes.Errors.length > 0) {
      console.error(`⚠️ Erros ao deletar lote: ${delRes.Errors.length} falhas.`);
      console.error(delRes.Errors.slice(0, 3));
    }
    deletedCount += chunk.length - (delRes.Errors?.length || 0);
    console.log(`🗑️ Progresso: ${deletedCount}/${orphanedObjects.length} arquivos excluídos.`);
  }

  console.log("\n==================================================");
  console.log("🎉 LIMPEZA CONCLUÍDA COM SUCESSO!");
  console.log(`- Arquivos deletados: ${deletedCount}`);
  console.log(`- Espaço liberado no Cloudflare R2: ${orphanedMB} MB`);
  console.log(`- Arquivos ativos mantidos com segurança: ${activeKeys.size}`);
  console.log("==================================================");
}

runCleanup().catch((err) => {
  console.error("❌ Erro fatal durante a execução:", err);
  process.exit(1);
});
