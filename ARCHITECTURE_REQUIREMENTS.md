# Требования к архитектуре приложения "Планировщик маршрутов"

## 📦 Модели данных

### 1. Trip (поездка)
- id: string
- title: string
- dates: {
  startDate: string
  endDate: string
}

### 2. LocationBlock (локация)
- id: string
- title: string
- arrival: {
  date: string
  time: string
}
- departure: {
  date: string
  time: string
}
- stayDuration: {
  hours: number
  minutes: number
}
- notes: string
- events: []

### 3. Transfer (переезд между локациями)
- id: string
- from: string
- to: string
- departure: {
  date: string
  time: string
}
- arrival: {
  date: string
  time: string
}
- duration: {
  hours: number
  minutes: number
}
- transportType: 'walking'|'flight'|'train'|'bus'|'car'
- flightNumber: string
- cost: {
  amount: number
  currency: string
}
- notes: string

### 4. EventGroup (группировка)
- id: string
- title: string
- items: [] // массив LocationBlock или Transfer
- notes: string

## 🧩 Функционал

### 1. Визуальный редактор
- Блоки можно перемещать
- Соединять стрелками (как на схеме)
- Свободное расположение (canvas)

### 2. Таймлайн
- Автоматическое выстраивание по времени
- Отображение:
  - длительности пребывания
  - времени в пути

### 3. Карточки
Каждая карточка содержит:
- название
- время (от–до)
- длительность (авто)
- заметки
- дополнительные поля (рейс, автобус и т.д.)

### 4. Связи
- Стрелки между точками
- Подписи у стрелок (время, стоимость)

### 5. Группировка
- Возможность объединить несколько карточек в одну рамку
- Сворачивание/разворачивание группы

### 6. Подсветка
- Разные цвета для:
  - локаций
  - переездов
  - важных заметок

## 🎨 UX/UI требования

- Темная тема (как на скриншоте)
- Стиль "рисования от руки" (опционально)
- Canvas (как Miro / FigJam)
- Зум и панорамирование
- Быстрое добавление через "+"
- Inline-редактирование текста