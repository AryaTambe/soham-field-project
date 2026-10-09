'use client';

import { useEffect, useRef, useState } from 'react';

type ProductVisualProps = {
  alt: string;
  src: string;
};

export function ProductVisual({ alt, src }: ProductVisualProps) {
  const [hasImage, setHasImage] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setHasImage(false);
  }, []);

  return (
    <div aria-label={alt} className="product-visual" role="img">
      {hasImage ? (
        <img
          alt={alt}
          onError={() => setHasImage(false)}
          ref={imageRef}
          src={src}
        />
      ) : (
        <span aria-hidden="true" className="product-placeholder">
          <svg fill="none" viewBox="0 0 40 40">
            <path d="M20 7v26M7 20h26" strokeLinecap="round" />
            <circle cx="20" cy="20" r="16" />
          </svg>
        </span>
      )}
    </div>
  );
}
