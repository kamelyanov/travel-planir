import { CARD_THEMES } from '../../constants/themes'

/**
 * Селектор цветовой темы карточки
 */
export function ColorPicker({ currentTheme = 'white', onThemeChange }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {Object.entries(CARD_THEMES).map(([key, theme]) => (
        <button
          key={key}
          onClick={() => onThemeChange(key)}
          className="relative w-6 h-6 rounded-full transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: theme.dot,
            border: currentTheme === key ? '2px solid #1A1A1A' : '2px solid transparent',
            boxShadow: currentTheme === key ? '0 0 0 2px white, 0 0 0 4px #1A1A1A' : 'none',
          }}
          title={`${theme.name} (${theme.description})`}
        />
      ))}
    </div>
  )
}
