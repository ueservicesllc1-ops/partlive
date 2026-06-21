export interface CountryOption {
  code: string;
  name: string;
  emoji: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'Estados Unidos', emoji: '🇺🇸' },
  { code: 'EC', name: 'Ecuador', emoji: '🇪🇨' },
  { code: 'CO', name: 'Colombia', emoji: '🇨🇴' },
  { code: 'MX', name: 'México', emoji: '🇲🇽' },
  { code: 'PE', name: 'Perú', emoji: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', emoji: '🇻🇪' },
  { code: 'DO', name: 'República Dominicana', emoji: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', emoji: '🇵🇷' },
  { code: 'CL', name: 'Chile', emoji: '🇨🇱' },
  { code: 'AR', name: 'Argentina', emoji: '🇦🇷' },
  { code: 'ES', name: 'España', emoji: '🇪🇸' },
  { code: 'BR', name: 'Brasil', emoji: '🇧🇷' },
  { code: 'CA', name: 'Canadá', emoji: '🇨🇦' },
  { code: 'GT', name: 'Guatemala', emoji: '🇬🇹' },
  { code: 'HN', name: 'Honduras', emoji: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', emoji: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', emoji: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', emoji: '🇨🇨' }, // Note: CR flag emoji is 🇨🇷, correction made below
  { code: 'PA', name: 'Panamá', emoji: '🇵🇦' },
  { code: 'BO', name: 'Bolivia', emoji: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', emoji: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', emoji: '🇺🇾' },
  { code: 'IT', name: 'Italia', emoji: '🇮🇹' },
  { code: 'FR', name: 'Francia', emoji: '🇫🇷' },
  { code: 'DE', name: 'Alemania', emoji: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', emoji: '🇬🇧' },
  { code: 'CN', name: 'China', emoji: '🇨🇳' },
  { code: 'JP', name: 'Japón', emoji: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', emoji: '🇰🇷' },
  { code: 'IN', name: 'India', emoji: '🇮🇳' },
].map(c => c.code === 'CR' ? { ...c, emoji: '🇨🇷' } : c);
