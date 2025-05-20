import { useState } from 'react'

interface WordImageProps {
  src: string
  alt: string
  className?: string
}

export function WordImage({ src, alt, className = '' }: WordImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-400">No image</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-lg object-cover ${className}`}
      onError={() => setError(true)}
    />
  )
} 