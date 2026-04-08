/**
 * Вертикальная линия таймлайна
 */
export function TimelineLine({ isPast = false, isFuture = false, height = 'full' }) {
  const heightClass = height === 'full' ? 'h-full' : height === 'half' ? 'h-1/2' : ''
  
  return (
    <div className={`w-0.5 ${heightClass} transition-all duration-200`}>
      <div 
        className="w-full h-full"
        style={{
          backgroundColor: isPast ? '#E5E5EA' : 'transparent',
          backgroundImage: isFuture 
            ? 'repeating-linear-gradient(to bottom, #E5E5EA 0, #E5E5EA 4px, transparent 4px, transparent 8px)'
            : 'none',
        }}
      />
    </div>
  )
}
