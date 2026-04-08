import { Lock } from 'lucide-react'
import { CARD_THEMES } from '../../constants/themes'

/**
 * Точка на таймлайне
 */
export function TimelineDot({ 
  theme = 'white', 
  isActive = false, 
  isLocked: isFixed = false, 
  size = 'sm' 
}) {
  const themeConfig = CARD_THEMES[theme] || CARD_THEMES.white
  
  const dotSize = size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5'
  const activeSize = size === 'lg' ? 'w-3 h-3' : 'w-3 h-3'
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Кружок */}
      <div
        className={`${isActive || isFixed ? activeSize : dotSize} rounded-full transition-all duration-200`}
        style={{
          backgroundColor: (isActive || isFixed) ? themeConfig.dot : 'transparent',
          border: `2px solid ${isFixed ? themeConfig.dot : '#C7C7CC'}`,
        }}
      />
      
      {/* Иконка замка */}
      {isFixed && (
        <Lock 
          className="absolute -right-4 top-1/2 -translate-y-1/2" 
          size={10} 
          style={{ color: themeConfig.dot }} 
        />
      )}
    </div>
  )
}
