/**
 * Media Sanitizer & Hash Randomizer
 *
 * Utilidade para:
 * 1. Limpar metadados de containers MP4 (udta, meta, uuid, XMP, GPS, tags de software/encoder).
 * 2. Randomizar timestamps internos de criação e modificação (mvhd, tkhd, mdhd).
 * 3. Injetar entropia aleatória única via átomo 'free' padrão ISO MP4, gerando SHA-256/MD5 único
 *    para cada publicação sem alterar a qualidade do áudio/vídeo.
 * 4. Limpar metadados EXIF/GPS de imagens de capa.
 */

// Segundos entre 1904-01-01 (Epoch MP4) e 1970-01-01 (Epoch Unix)
const MP4_EPOCH_OFFSET = 2082844800;

function dateToMp4Time(date: Date): number {
  return Math.floor(date.getTime() / 1000) + MP4_EPOCH_OFFSET;
}

/**
 * Sanitiza metadados e randomiza o hash criptográfico de um arquivo de vídeo MP4.
 */
export async function sanitizeAndMutateMp4(
  file: File | Blob,
  options: {
    customFileName?: string;
    seed?: string | number;
    timestampOffsetSeconds?: number;
  } = {},
): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const view = new DataView(buffer.buffer);

  // Calcula um timestamp base com leve jitter aleatório
  const now = new Date();
  const randomJitter = Math.floor(Math.random() * 3600 * 24); // até 24h de variação
  const targetMp4Time = dateToMp4Time(now) - randomJitter;

  // Função auxiliar recursiva para percorrer átomos
  function processBoxes(start: number, end: number, containerType?: string) {
    let offset = start;

    while (offset + 8 <= end) {
      let size = view.getUint32(offset);
      const type = String.fromCharCode(
        buffer[offset + 4],
        buffer[offset + 5],
        buffer[offset + 6],
        buffer[offset + 7],
      );

      let headerSize = 8;
      if (size === 1) {
        // 64-bit large size
        if (offset + 16 > end) break;
        // Lendo os 32 bits inferiores do tamanho de 64 bits
        size = Number(view.getBigUint64(offset + 8));
        headerSize = 16;
      } else if (size === 0) {
        // Vai até o final do arquivo/container
        size = end - offset;
      }

      if (size < headerSize || offset + size > end) {
        // Átomo malformado ou truncado, interrompe varredura
        break;
      }

      const payloadOffset = offset + headerSize;
      const payloadSize = size - headerSize;

      // 1. Substitui átomos de metadados sensíveis por 'free' e zera conteúdo
      // Isso preserva o tamanho exato dos bytes sem quebrar tabelas de offsets (stco/co64)
      if (
        type === "udta" ||
        type === "meta" ||
        type === "uuid" ||
        type === "XMP_" ||
        type === "ilst" ||
        type === "©too" ||
        type === "©nam" ||
        type === "©ART" ||
        type === "©day" ||
        type === "@xyz" ||
        type === "loci"
      ) {
        // Transforma o tipo em 'free'
        buffer[offset + 4] = 0x66; // 'f'
        buffer[offset + 5] = 0x72; // 'r'
        buffer[offset + 6] = 0x65; // 'e'
        buffer[offset + 7] = 0x65; // 'e'

        // Zera o payload de metadados
        for (let i = payloadOffset; i < offset + size; i++) {
          buffer[i] = 0x00;
        }
      }

      // 2. Modifica timestamps em cabeçalhos (mvhd, tkhd, mdhd) com jitter único
      if (type === "mvhd" || type === "tkhd" || type === "mdhd") {
        if (payloadSize >= 12) {
          const version = buffer[payloadOffset];
          // Pequeno jitter adicional por atom
          const atomJitter = Math.floor(Math.random() * 300);
          const atomTime = targetMp4Time - atomJitter;

          if (version === 0) {
            // Version 0: 32-bit creation_time e modification_time
            view.setUint32(payloadOffset + 4, atomTime);
            view.setUint32(payloadOffset + 8, atomTime);
          } else if (version === 1 && payloadSize >= 20) {
            // Version 1: 64-bit creation_time e modification_time
            view.setBigUint64(payloadOffset + 4, BigInt(atomTime));
            view.setBigUint64(payloadOffset + 12, BigInt(atomTime));
          }
        }
      }

      // 3. Entra em contêineres aninhados
      if (
        type === "moov" ||
        type === "trak" ||
        type === "mdia" ||
        type === "minf" ||
        type === "dinf" ||
        type === "stbl"
      ) {
        processBoxes(payloadOffset, offset + size, type);
      }

      offset += size;
    }
  }

  // Executa o processamento dos átomos no buffer existente
  try {
    processBoxes(0, buffer.length);
  } catch (err) {
    console.warn("Aviso ao analisar átomos MP4 (continuando com injeção de entropia):", err);
  }

  // 4. Injeta um átomo 'free' final com entropia criptográfica única garantida
  // Isso altera 100% o hash SHA-256 e MD5 sem afetar o streaming ou a decodificação
  const saltLength = 64;
  const freeBoxSize = 8 + saltLength;
  const freeBox = new Uint8Array(freeBoxSize);
  const freeBoxView = new DataView(freeBox.buffer);

  freeBoxView.setUint32(0, freeBoxSize);
  freeBox[4] = 0x66; // 'f'
  freeBox[5] = 0x72; // 'r'
  freeBox[6] = 0x65; // 'e'
  freeBox[7] = 0x65; // 'e'

  // Preenche com bytes criptograficamente aleatórios
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(freeBox.subarray(8));
  } else {
    for (let i = 8; i < freeBoxSize; i++) {
      freeBox[i] = Math.floor(Math.random() * 256);
    }
  }

  // Combina o buffer original limpo com o novo átomo 'free'
  const combinedBlob = new Blob([buffer, freeBox], {
    type: file.type || "video/mp4",
  });

  const originalName = (file as File).name || "video.mp4";
  const nameParts = originalName.split(".");
  const ext = nameParts.length > 1 ? nameParts.pop() : "mp4";
  const baseName = nameParts.join(".");
  const finalFileName =
    options.customFileName || `${baseName}_clean_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

  return new File([combinedBlob], finalFileName, {
    type: file.type || "video/mp4",
    lastModified: Date.now(),
  });
}

/**
 * Sanitiza metadados EXIF/GPS de imagens de capa gerando uma cópia limpa
 * com micro-variação perceptual imperceptível (anti-hash matching).
 */
export async function sanitizeImageCover(
  file: File | Blob,
  customFileName?: string,
  options: { applyPerceptualJitter?: boolean } = { applyPerceptualJitter: true },
): Promise<File> {
  const mimeType = file.type || "image/jpeg";

  // Se estiver no browser com suporte a Canvas/ImageBitmap, recria a imagem limpa
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Falha ao carregar imagem para limpeza de EXIF"));
        img.src = objectUrl;
      });

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;

      // Micro-crop imperceptível de 1-2px se jitter estiver ativo
      const cropOffset = options.applyPerceptualJitter ? (Math.random() > 0.5 ? 1 : 0) : 0;
      const targetW = Math.max(10, naturalW - cropOffset);
      const targetH = Math.max(10, naturalH - cropOffset);

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Aplica leve filtro de brilho/contraste imperceptível (0.998 a 1.002)
        if (options.applyPerceptualJitter) {
          const brightnessFactor = 0.998 + Math.random() * 0.004;
          ctx.filter = `brightness(${brightnessFactor.toFixed(4)})`;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        URL.revokeObjectURL(objectUrl);

        // Qualidade com leve micro-variação de compressão para invalidar JPEG quant table hash
        const quality = options.applyPerceptualJitter
          ? 0.94 + Math.random() * 0.03
          : 0.95;

        const cleanBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), mimeType, quality);
        });

        if (cleanBlob) {
          const originalName = (file as File).name || "cover.jpg";
          const fileName =
            customFileName || `cover_clean_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${mimeType.includes("png") ? "png" : "jpg"}`;

          return new File([cleanBlob], fileName, {
            type: mimeType,
            lastModified: Date.now(),
          });
        }
      }
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.warn("Aviso ao limpar metadados de imagem via canvas, usando fallback:", e);
    }
  }

  // Fallback: Retorna o arquivo original com timestamp atualizado se canvas falhar
  const originalName = (file as File).name || "cover.jpg";
  return new File([file], customFileName || originalName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
