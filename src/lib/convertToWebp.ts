const ALLOWED_TYPES = ['image/webp', 'image/png', 'image/jpeg'];
const MAX_BYTES = 300 * 1024;
const MAX_DIMENSION = 800;

export type ConvertResult =
  | { ok: true; file: File; preview: string }
  | { ok: false; error: string };

export async function convertToWebp(input: File, quality = 0.88): Promise<ConvertResult> {
  if (!ALLOWED_TYPES.includes(input.type)) {
    return { ok: false, error: 'Formato inválido. Use .webp, .png ou .jpg.' };
  }
  if (input.size > MAX_BYTES) {
    return { ok: false, error: `Arquivo muito grande (${(input.size / 1024).toFixed(0)} KB). Máximo: 300 KB.` };
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(input);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ ok: false, error: 'Não foi possível processar a imagem.' });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ ok: false, error: 'Falha na conversão para .webp.' });
            return;
          }
          const file = new File([blob], 'imagem.webp', { type: 'image/webp' });
          const preview = URL.createObjectURL(blob);
          resolve({ ok: true, file, preview });
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: 'Não foi possível carregar a imagem.' });
    };

    img.src = url;
  });
}
