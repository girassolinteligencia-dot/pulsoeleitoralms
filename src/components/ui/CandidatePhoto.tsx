'use client';

import Image from 'next/image';
import { UserRound } from 'lucide-react';
import { useState } from 'react';

interface CandidatePhotoProps {
  src?: string | null;
  alt: string;
  size?: number;
}

export function CandidatePhoto({ src, alt, size = 48 }: CandidatePhotoProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(src) && !failed;

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#141413]">
      {hasImage ? (
        <Image
          src={src as string}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <UserRound size={Math.max(18, Math.round(size * 0.42))} className="text-[#7a6e64]" />
      )}
    </div>
  );
}
