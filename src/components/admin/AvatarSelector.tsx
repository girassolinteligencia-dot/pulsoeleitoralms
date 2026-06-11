'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { adminFetch } from '@/lib/adminClient';
import { convertToWebp } from '@/lib/convertToWebp';

// ---------------------------------------------------------------------------
// Galeria de avatares pré-definidos (SVG inline como data URIs)
// ---------------------------------------------------------------------------

export type AvatarKind = 'orgao' | 'servico' | 'politico';

interface PresetAvatar {
  id: string;
  label: string;
  svg: string;
}

const AVATARES_ORGAO: PresetAvatar[] = [
  {
    id: 'prefeitura',
    label: 'Prefeitura',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1e3a5f"/>
      <rect x="8" y="38" width="48" height="18" rx="2" fill="#2d5a9e"/>
      <rect x="20" y="28" width="24" height="12" rx="1" fill="#3a7bd5"/>
      <rect x="28" y="16" width="8" height="14" rx="1" fill="#4a8fe8"/>
      <polygon points="32,8 26,18 38,18" fill="#6ab0ff"/>
      <rect x="14" y="44" width="6" height="8" fill="#1a3060"/>
      <rect x="29" y="44" width="6" height="8" fill="#1a3060"/>
      <rect x="44" y="44" width="6" height="8" fill="#1a3060"/>
    </svg>`,
  },
  {
    id: 'camara',
    label: 'Câmara',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1f3c1a"/>
      <ellipse cx="32" cy="24" rx="20" ry="6" fill="#2e6e22"/>
      <rect x="12" y="24" width="40" height="18" fill="#2e6e22"/>
      <rect x="8" y="42" width="48" height="6" rx="2" fill="#3a8c2c"/>
      <rect x="16" y="30" width="4" height="12" fill="#1a4f14"/>
      <rect x="24" y="30" width="4" height="12" fill="#1a4f14"/>
      <rect x="36" y="30" width="4" height="12" fill="#1a4f14"/>
      <rect x="44" y="30" width="4" height="12" fill="#1a4f14"/>
      <polygon points="32,10 22,20 42,20" fill="#5cb84a"/>
      <circle cx="32" cy="10" r="3" fill="#8fdc7a"/>
    </svg>`,
  },
  {
    id: 'tribunal',
    label: 'Tribunal',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#2c1a4a"/>
      <rect x="8" y="40" width="48" height="16" rx="2" fill="#4a2e7a"/>
      <rect x="16" y="26" width="32" height="16" fill="#5a3a90"/>
      <rect x="8" y="36" width="48" height="6" rx="1" fill="#6a4aaa"/>
      <polygon points="32,10 14,28 50,28" fill="#7a5aba"/>
      <rect x="28" y="44" width="8" height="10" fill="#3a2060"/>
      <line x1="32" y1="18" x2="20" y2="32" stroke="#c0a0ff" stroke-width="1.5"/>
      <line x1="32" y1="18" x2="44" y2="32" stroke="#c0a0ff" stroke-width="1.5"/>
      <circle cx="32" cy="17" r="3" fill="#d4b8ff"/>
    </svg>`,
  },
  {
    id: 'mp',
    label: 'Min. Público',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1a1a2e"/>
      <circle cx="32" cy="28" r="16" fill="#16213e"/>
      <circle cx="32" cy="28" r="12" fill="#0f3460"/>
      <path d="M24 28 L32 16 L40 28 L36 28 L36 38 L28 38 L28 28 Z" fill="#e94560"/>
      <rect x="10" y="46" width="44" height="8" rx="3" fill="#0f3460"/>
      <circle cx="32" cy="28" r="4" fill="#f5f5f5"/>
    </svg>`,
  },
  {
    id: 'governo',
    label: 'Governo',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1a2f1a"/>
      <rect x="8" y="44" width="48" height="12" rx="2" fill="#2d5a2d"/>
      <rect x="10" y="32" width="44" height="14" fill="#366e36"/>
      <rect x="14" y="22" width="36" height="12" fill="#3d8040"/>
      <rect x="20" y="14" width="24" height="10" fill="#44a044"/>
      <rect x="8" y="42" width="48" height="4" rx="1" fill="#4ab84a"/>
      <rect x="28" y="44" width="8" height="12" fill="#1a3a1a"/>
      <circle cx="32" cy="10" r="5" fill="#6edd6e"/>
    </svg>`,
  },
  {
    id: 'assembleia',
    label: 'Assembleia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1a1a3e"/>
      <rect x="8" y="40" width="48" height="16" rx="2" fill="#2a2a6e"/>
      <rect x="12" y="28" width="40" height="14" fill="#3535a0"/>
      <rect x="8" y="36" width="48" height="5" fill="#4040c0"/>
      <polygon points="32,10 10,30 54,30" fill="#5050d8"/>
      <rect x="28" y="44" width="8" height="12" fill="#1a1a50"/>
      <circle cx="20" cy="34" r="2" fill="#8080ff"/>
      <circle cx="32" cy="34" r="2" fill="#8080ff"/>
      <circle cx="44" cy="34" r="2" fill="#8080ff"/>
    </svg>`,
  },
  {
    id: 'defensoria',
    label: 'Defensoria',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1a2a3a"/>
      <path d="M32 10 L48 20 L48 44 L32 54 L16 44 L16 20 Z" fill="#1e4060"/>
      <path d="M32 16 L44 24 L44 40 L32 48 L20 40 L20 24 Z" fill="#2860a0"/>
      <text x="32" y="36" text-anchor="middle" font-size="20" fill="#60b0ff" font-family="serif" font-weight="bold">§</text>
    </svg>`,
  },
  {
    id: 'tce',
    label: 'Trib. Contas',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#2a1a10"/>
      <rect x="10" y="18" width="44" height="32" rx="3" fill="#5a3010"/>
      <rect x="14" y="22" width="36" height="24" rx="2" fill="#7a4218"/>
      <line x1="18" y1="30" x2="46" y2="30" stroke="#d4a060" stroke-width="1.5"/>
      <line x1="18" y1="36" x2="38" y2="36" stroke="#d4a060" stroke-width="1.5"/>
      <line x1="18" y1="42" x2="34" y2="42" stroke="#d4a060" stroke-width="1.5"/>
      <rect x="28" y="8" width="8" height="12" rx="2" fill="#9a5a20"/>
      <rect x="14" y="48" width="36" height="6" rx="2" fill="#5a3010"/>
    </svg>`,
  },
];

const AVATARES_SERVICO: PresetAvatar[] = [
  {
    id: 'upa',
    label: 'UPA',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#8b0000"/>
      <rect x="8" y="16" width="48" height="36" rx="4" fill="#cc0000"/>
      <rect x="28" y="20" width="8" height="28" fill="white"/>
      <rect x="20" y="28" width="24" height="8" fill="white"/>
      <text x="32" y="62" text-anchor="middle" font-size="7" fill="#cc4444" font-family="sans-serif" font-weight="bold">UPA</text>
    </svg>`,
  },
  {
    id: 'ubs',
    label: 'UBS / Posto',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#006633"/>
      <rect x="10" y="20" width="44" height="32" rx="4" fill="#008844"/>
      <rect x="28" y="24" width="8" height="24" fill="white"/>
      <rect x="20" y="32" width="24" height="8" fill="white"/>
      <path d="M16 20 Q32 8 48 20" fill="#00aa55"/>
    </svg>`,
  },
  {
    id: 'hospital',
    label: 'Hospital',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#003366"/>
      <rect x="8" y="20" width="48" height="36" rx="3" fill="#0044aa"/>
      <rect x="28" y="10" width="8" height="14" rx="2" fill="#0055cc"/>
      <rect x="26" y="26" width="12" height="22" fill="white" opacity="0.9"/>
      <rect x="20" y="32" width="24" height="8" fill="white" opacity="0.9"/>
      <rect x="18" y="44" width="8" height="12" fill="#002a6e"/>
      <rect x="38" y="44" width="8" height="12" fill="#002a6e"/>
    </svg>`,
  },
  {
    id: 'escola',
    label: 'Escola',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#4a2080"/>
      <rect x="10" y="28" width="44" height="28" rx="3" fill="#6a30c0"/>
      <polygon points="32,10 8,30 56,30" fill="#7a40e0"/>
      <rect x="26" y="38" width="12" height="18" rx="2" fill="#3a1060"/>
      <rect x="14" y="34" width="10" height="10" rx="1" fill="#9a60ff" opacity="0.6"/>
      <rect x="40" y="34" width="10" height="10" rx="1" fill="#9a60ff" opacity="0.6"/>
    </svg>`,
  },
  {
    id: 'transporte',
    label: 'Transporte',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1a3a5a"/>
      <rect x="8" y="20" width="48" height="28" rx="6" fill="#2a5a9a"/>
      <rect x="10" y="22" width="44" height="16" rx="4" fill="#1a4a8a"/>
      <rect x="12" y="24" width="18" height="10" rx="2" fill="#6ab0ff" opacity="0.8"/>
      <rect x="34" y="24" width="18" height="10" rx="2" fill="#6ab0ff" opacity="0.8"/>
      <circle cx="18" cy="50" r="6" fill="#1a3060"/>
      <circle cx="18" cy="50" r="3" fill="#4a80c0"/>
      <circle cx="46" cy="50" r="6" fill="#1a3060"/>
      <circle cx="46" cy="50" r="3" fill="#4a80c0"/>
    </svg>`,
  },
  {
    id: 'saneamento',
    label: 'Saneamento',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#003355"/>
      <ellipse cx="32" cy="30" rx="20" ry="16" fill="#0055aa"/>
      <ellipse cx="32" cy="30" rx="14" ry="10" fill="#0077cc"/>
      <path d="M18 30 Q32 18 46 30 Q32 42 18 30" fill="#00aaee" opacity="0.6"/>
      <rect x="28" y="44" width="8" height="12" rx="2" fill="#0044aa"/>
      <rect x="20" y="54" width="24" height="4" rx="2" fill="#003380"/>
    </svg>`,
  },
  {
    id: 'energia',
    label: 'Energia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#3a3000"/>
      <polygon points="38,8 24,32 34,32 26,56 44,28 34,28" fill="#ffcc00"/>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#ffaa00" stroke-width="2" opacity="0.4"/>
    </svg>`,
  },
  {
    id: 'cras',
    label: 'CRAS',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#1a3a2a"/>
      <circle cx="32" cy="22" r="10" fill="#2a6a4a"/>
      <path d="M14 52 Q14 36 32 36 Q50 36 50 52" fill="#2a6a4a"/>
      <circle cx="20" cy="22" r="7" fill="#3a8a6a" opacity="0.7"/>
      <circle cx="44" cy="22" r="7" fill="#3a8a6a" opacity="0.7"/>
      <rect x="28" y="26" width="8" height="8" rx="4" fill="#5aaa8a"/>
    </svg>`,
  },
];

const AVATARES_POLITICO: PresetAvatar[] = [
  {
    id: 'politico_m',
    label: 'Político',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#1e2a3a"/>
      <circle cx="32" cy="24" r="12" fill="#2a4060"/>
      <path d="M10 56 Q10 42 32 42 Q54 42 54 56" fill="#2a4060"/>
    </svg>`,
  },
  {
    id: 'politico_f',
    label: 'Política',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#3a1a2a"/>
      <circle cx="32" cy="22" r="11" fill="#6a2a4a"/>
      <path d="M12 56 Q12 40 32 40 Q52 40 52 56" fill="#6a2a4a"/>
      <path d="M22 16 Q24 10 32 10 Q40 10 42 16" fill="#8a3a6a" opacity="0.6"/>
    </svg>`,
  },
  {
    id: 'prefeito',
    label: 'Prefeito(a)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#1a2a1a"/>
      <circle cx="32" cy="22" r="11" fill="#2a5a2a"/>
      <path d="M12 56 Q12 40 32 40 Q52 40 52 56" fill="#2a5a2a"/>
      <polygon points="32,6 28,14 36,14" fill="#60c060"/>
    </svg>`,
  },
  {
    id: 'vereador',
    label: 'Vereador(a)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#1a1a3a"/>
      <circle cx="32" cy="22" r="11" fill="#2a2a7a"/>
      <path d="M12 56 Q12 40 32 40 Q52 40 52 56" fill="#2a2a7a"/>
      <rect x="26" y="8" width="12" height="4" rx="2" fill="#6060e0"/>
    </svg>`,
  },
  {
    id: 'deputado',
    label: 'Deputado(a)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#2a1a10"/>
      <circle cx="32" cy="22" r="11" fill="#6a3a18"/>
      <path d="M12 56 Q12 40 32 40 Q52 40 52 56" fill="#6a3a18"/>
      <path d="M24 12 L32 8 L40 12" stroke="#e0a060" stroke-width="2" fill="none"/>
    </svg>`,
  },
  {
    id: 'senador',
    label: 'Senador(a)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="#1a1010"/>
      <circle cx="32" cy="22" r="11" fill="#5a1010"/>
      <path d="M12 56 Q12 40 32 40 Q52 40 52 56" fill="#5a1010"/>
      <circle cx="32" cy="8" r="4" fill="#cc3030"/>
    </svg>`,
  },
];

const GALERIA: Record<AvatarKind, PresetAvatar[]> = {
  orgao: AVATARES_ORGAO,
  servico: AVATARES_SERVICO,
  politico: AVATARES_POLITICO,
};

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encoded}`;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface AvatarSelectorProps {
  kind: AvatarKind;
  currentUrl?: string | null;
  entityId?: string;
  endpoint: string;
  fieldName: string;
  deleteEndpoint?: string;
  onFile?: (file: File | null) => void;
  onUploaded?: (url: string | null) => void;
  placeholder?: string;
}

export function AvatarSelector({
  kind,
  currentUrl,
  entityId,
  endpoint,
  fieldName,
  deleteEndpoint,
  onFile,
  onUploaded,
  placeholder = '🏛️',
}: AvatarSelectorProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro] = useState('');
  const [showGaleria, setShowGaleria] = useState(false);

  const presets = GALERIA[kind];

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErro('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const result = await convertToWebp(file);
    if (!result.ok) { setErro(result.error); return; }

    setPreview(result.preview);

    if (entityId) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('foto', result.file);
        fd.append(fieldName, entityId);
        const res = await adminFetch(endpoint, { method: 'POST', body: fd });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setErro(d.error || 'Erro no upload.');
          return;
        }
        const d = await res.json();
        onUploaded?.(d.foto_url);
      } finally {
        setUploading(false);
      }
    } else {
      onFile?.(result.file);
    }
  }, [entityId, endpoint, fieldName, onFile, onUploaded]);

  const handleDelete = useCallback(async () => {
    setErro('');
    if (entityId && deleteEndpoint) {
      setDeleting(true);
      try {
        const res = await adminFetch(`${deleteEndpoint}?${fieldName}=${entityId}`, { method: 'DELETE' });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setErro(d.error || 'Erro ao remover imagem.');
          return;
        }
      } finally {
        setDeleting(false);
      }
    }
    setPreview(null);
    onFile?.(null);
    onUploaded?.(null);
  }, [entityId, deleteEndpoint, fieldName, onFile, onUploaded]);

  const handlePresetSelect = useCallback(async (preset: PresetAvatar) => {
    const dataUri = svgToDataUri(preset.svg);
    setShowGaleria(false);
    setErro('');

    if (entityId) {
      // Converte o SVG em File webp e faz upload
      setUploading(true);
      try {
        const img = new window.Image();
        img.src = dataUri;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 128, 128);
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.92));
        if (!blob) { setErro('Erro ao converter avatar.'); return; }
        const file = new File([blob], `${preset.id}.webp`, { type: 'image/webp' });
        const fd = new FormData();
        fd.append('foto', file);
        fd.append(fieldName, entityId);
        const uploadRes = await adminFetch(endpoint, { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const d = await uploadRes.json().catch(() => ({}));
          setErro(d.error || 'Erro no upload do avatar.');
          return;
        }
        const d = await uploadRes.json();
        setPreview(dataUri);
        onUploaded?.(d.foto_url);
      } finally {
        setUploading(false);
      }
    } else {
      // Sem id ainda — converte para File e repassa para o pai
      setUploading(true);
      try {
        const img = new window.Image();
        img.src = dataUri;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
        });
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 128, 128);
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.92));
        if (!blob) { setErro('Erro ao converter avatar.'); return; }
        const file = new File([blob], `${preset.id}.webp`, { type: 'image/webp' });
        setPreview(dataUri);
        onFile?.(file);
      } finally {
        setUploading(false);
      }
    }
  }, [entityId, endpoint, fieldName, onFile, onUploaded]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center relative">
          {preview ? (
            <Image src={preview} alt="Avatar" width={56} height={56} className="object-cover w-full h-full" unoptimized />
          ) : (
            <span className="text-xl opacity-20">{placeholder}</span>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            {/* Upload de arquivo */}
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full border-0 text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary hover:bg-primary/30 transition-all whitespace-nowrap">
                {uploading ? 'Enviando...' : '↑ Carregar imagem'}
              </span>
              <input
                type="file"
                accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg"
                onChange={handleFileChange}
                disabled={uploading || deleting}
                className="sr-only"
              />
            </label>

            {/* Galeria de avatares */}
            <button
              type="button"
              onClick={() => setShowGaleria(v => !v)}
              disabled={uploading || deleting}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 whitespace-nowrap disabled:opacity-40"
            >
              ◈ Avatares
            </button>

            {/* Excluir */}
            {preview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading || deleting}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest bg-negative/10 text-negative hover:bg-negative/20 transition-all border border-negative/20 whitespace-nowrap disabled:opacity-40"
              >
                {deleting ? 'Removendo...' : '✕ Remover'}
              </button>
            )}
          </div>

          <p className="text-[10px] text-text-muted opacity-50">
            .webp · .png · .jpg — máx. 300 KB — salvo como .webp
          </p>
          {erro && <p className="text-[10px] text-negative font-bold">{erro}</p>}
        </div>
      </div>

      {/* Galeria de presets */}
      {showGaleria && (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-3">
            Escolha um avatar pré-definido
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                disabled={uploading}
                title={preset.label}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all group disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/40 transition-colors">
                  <Image
                    src={svgToDataUri(preset.svg)}
                    alt={preset.label}
                    width={40}
                    height={40}
                    className="w-full h-full"
                    unoptimized
                  />
                </div>
                <span className="text-[8px] text-text-muted group-hover:text-white transition-colors text-center leading-tight">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
