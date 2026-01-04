export const colors = {
  primary: '#1E90FF', // Ocean blue
  accent: '#7F5AF0', // secondary glow
  background: '#050507',
  surface: '#1A1A1E',
  card: '#242428',
  text: '#F5F7FB',
  textSecondary: '#A3AEC2',
  border: '#3A3A42',
  error: '#FF5F6D',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
};

export const shadows = {
  small: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  medium: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  large: {
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
};
