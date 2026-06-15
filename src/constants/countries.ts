export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
];
