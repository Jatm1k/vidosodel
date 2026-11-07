/** Names of the motion formats and grades for the editor (the renderer's catalogue holds their descriptions). */
export const FORMAT_LABEL: Record<string, string> = {
  explainer: 'Объясняющая',
  archive: 'Архив',
  cinematic: 'Кино-эссе',
  data: 'Данные',
  sketch: 'Рисунок от руки',
  collage: 'Коллаж',
  interface: 'Интерфейс',
}

export const FORMAT_HINT: Record<string, string> = {
  explainer: 'яркая графика, крупные цифры, иконки, персонажи-вырезки, бодрая камера',
  archive: 'письма, рукописи, карточки, гравюрные портреты на столе; медленная камера; сепия, плёнка, пыль',
  cinematic: 'тёмные кадры с воздухом, изящные титры, цитаты, картинки во весь кадр; тонировка и ореол света',
  data: 'точные графики и карты, которые строятся и меняются; строгая сетка',
  sketch: 'всё рисуется от руки: дудлы, маркер, рукописные пометки; анимация «по двойкам»',
  collage: 'бумажные вырезки, растровые фото, рваные края, скотч; стоп-моушн',
  interface: 'экраны, терминалы, сканирующие рамки, данные; холодная тонировка',
}

export const GRADE_LABEL: Record<string, string> = {
  none: 'Без тонировки',
  warm: 'Тёплая',
  sepia: 'Сепия',
  mono: 'Чёрно-белая',
  cold: 'Холодная',
  faded: 'Выцветшая',
  teal: 'Кино (бирюза и янтарь)',
  bleach: 'Отбеливание',
}

export const formatLabel = (name: string | null | undefined) => (name ? FORMAT_LABEL[name] ?? name : '—')
