import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface SafeImageProps extends Omit<ImageProps, "onError" | "src" | "alt"> {
  src: string | null | undefined;
  fallbackSrc?: string;
  alt: string;
}

export function SafeImage({ src, fallbackSrc = "/images/placeholder.svg", alt, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <Image
      {...props}
      alt={alt}
      src={imgSrc}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
