export type AnchorId = 'led' | 'mics' | 'tweeters' | 'woofer';

export const CALLOUTS: { anchor: AnchorId; title: string; text: string }[] = [
  { anchor: 'led', title: '96 светодиодов', text: 'Кольцо света под стеклом реагирует на ритм за 8 мс.' },
  { anchor: 'mics', title: '6 микрофонов', text: 'Слышат голос через громкую музыку с другого конца комнаты.' },
  { anchor: 'tweeters', title: '7 твитеров по кругу', text: 'Звук 360° — в любой точке комнаты как в центре.' },
  { anchor: 'woofer', title: 'Сабвуфер 4″', text: 'Плотный бас до 38 Гц из корпуса высотой 19 см.' },
];

export interface LightMode {
  id: string;
  name: string;
  description: string;
  colors: [string, string, string];
}

export const LIGHT_MODES: LightMode[] = [
  { id: 'aurora', name: 'Аврора', description: 'Холодное сияние для вечера с музыкой.', colors: ['#2affc6', '#3b7bff', '#b45cff'] },
  { id: 'sunset', name: 'Закат', description: 'Тёплый свет, который не мешает уснуть.', colors: ['#ffb347', '#ff5e7a', '#8c3cff'] },
  { id: 'ocean', name: 'Океан', description: 'Спокойные волны для работы и чтения.', colors: ['#7ff3ff', '#1f8bff', '#e8f6ff'] },
];

export interface ColorVariant {
  id: string;
  name: string;
  description: string;
  fabric: string;
  sheen: string;
  swatch: string;
}

export const COLORS: ColorVariant[] = [
  { id: 'midnight', name: 'Полночь', description: 'Глубокий графит, который растворяется в вечерней комнате.', fabric: '#23263a', sheen: '#7d86c9', swatch: '#2b2f47' },
  { id: 'glacier', name: 'Ледник', description: 'Светлая ткань с холодным отливом — для минималистичных интерьеров.', fabric: '#d7dde8', sheen: '#ffffff', swatch: '#dfe4ee' },
  { id: 'sand', name: 'Песок', description: 'Тёплый бежевый, как лён в солнечный день.', fabric: '#b9a383', sheen: '#fff1d6', swatch: '#c8b391' },
];

export const SCENARIOS: { title: string; time: string; text: string; gradient: string }[] = [
  { time: '07:00', title: 'Мягкое утро', text: 'Свет разгорается за 15 минут до будильника, музыка — когда вы уже проснулись.', gradient: 'linear-gradient(135deg, #ffb36b, #ff6f91 55%, #4a3d8f)' },
  { time: '12:30', title: 'Фокус', text: 'Белый шум и ровный холодный свет. Уведомления подождут.', gradient: 'linear-gradient(135deg, #7ff3ff, #1f8bff 60%, #102a5c)' },
  { time: '19:00', title: 'Ужин', text: 'Тихий джаз и тёплый янтарный свет на столе.', gradient: 'linear-gradient(135deg, #ffd27a, #e8833a 55%, #5a2a1a)' },
  { time: '22:00', title: 'Кино', text: 'Колонка становится центральным каналом, а свет приглушается сам.', gradient: 'linear-gradient(135deg, #b45cff, #3b2a8f 55%, #0c0c1f)' },
  { time: '23:30', title: 'Сон', text: 'Звуки дождя и свет, который гаснет вместе с вами.', gradient: 'linear-gradient(135deg, #2affc6, #2a5b8f 55%, #0a1220)' },
];

export const SPECS: { value: number; decimals?: number; unit: string; label: string }[] = [
  { value: 38, unit: 'Гц', label: 'нижняя граница баса' },
  { value: 360, unit: '°', label: 'звуковое поле' },
  { value: 96, unit: 'дБ', label: 'максимальная громкость' },
  { value: 19, unit: 'см', label: 'высота корпуса' },
  { value: 1.4, decimals: 1, unit: 'кг', label: 'вес' },
  { value: 8, unit: 'мс', label: 'задержка света' },
];
