export interface ResumeStyle {
  template: 'classic' | 'modern' | 'compact';
  fontFamily: { heading: string; body: string };
  colors: { primary: string; text: string; muted: string; background: string };
  spacing: { section: number; item: number; lineHeight: number };
  fontSize: { name: number; heading: number; body: number };
  columns: 1 | 2;
  showIcons: boolean;
}

export const DEFAULT_RESUME_STYLE: ResumeStyle = {
  template: 'classic',
  fontFamily: { heading: 'Arial', body: 'Arial' },
  colors: {
    primary: '#000000',
    text: '#1a1a1a',
    muted: '#666666',
    background: '#ffffff',
  },
  spacing: { section: 12, item: 4, lineHeight: 1.4 },
  fontSize: { name: 18, heading: 12, body: 11 },
  columns: 1,
  showIcons: false,
};
