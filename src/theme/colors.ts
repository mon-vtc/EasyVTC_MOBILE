export const Colors = {
  // Charte EasyVTC
  bordeaux:      '#3D1515',
  bordeauxLight: '#602C2D',
  bordeauxDark:  '#1A0505',
  beige:         '#C9956A',
  beigeLight:    '#F0E0D0',
  beigeDark:     '#A87550',

  // UI
  white:         '#FFFFFF',
  black:         '#0A0A0A',
  background:    '#F5EDE6',
  surface:       '#FFFEFE',
  // border:        '#E8D5C4',
  border: '#E5E7EB', // Light gray for better contrast
  borderFocus:   '#C9956A',
  borderWith:    3,

//ICONS
  iconPrimary:   '#9CA3AF',
  iconSecondary: '#7A5A4A',
  iconMuted:     '#B0907A',
  iconLight:     '#FFFFFF',
  iconBg:        '#EFEAEA',

  // Text
  textPrimary:   '#1A0A0A',
  textSecondary: '#7A5A4A',
  textMuted:     '#B0907A',
  textLight:     '#602C2D',
  textCallToAction: '#4B5563',
  textPlaceholder: '#9CA3AF',

  placeHolder:    '#F9FAFB',

  // States
  success:       '#2D6A4F',
  successLight:  '#D8F3DC',
  error:         '#C0392B',
  errorLight:    '#FDECEA',
  warning:       '#D97706',
  warningLight:  '#FEF3C7',

  // Overlay
  overlay:       'rgba(74, 28, 28, 0.6)',
  overlayLight:  'rgba(74, 28, 28, 0.1)',
} as const;

export const Fonts = {
  regular:  'System',
  medium:   'System',
  bold:     'System',
  size: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  26,
    xxxl: 32,
  },
} as const;

export const Spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
} as const;

export const Radius = {
  sm:   6,
  md:   12,
  lg:   20,
  xl:   32,
  full: 999,
} as const;