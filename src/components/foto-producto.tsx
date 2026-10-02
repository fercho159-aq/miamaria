import Image from 'next/image'

/** Foto del producto o, si aún no tiene, un marco con el símbolo de la casa. */
export function FotoProducto({
  src,
  alt,
  sizes,
  priority,
  className = '',
}: {
  src: string | null
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-tinta ${className}`}>
        <Image src="/images/logo-simbolo.png" alt="" width={120} height={120} className="h-auto w-1/3 opacity-25" />
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
      unoptimized={src.startsWith('/uploads/')}
    />
  )
}
