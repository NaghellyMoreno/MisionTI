/**
 * Fuentes citadas en la clase. Para la empresa invitada solo se usan fuentes
 * oficiales de la propia empresa; para la normativa, los textos oficiales.
 */
export interface Source {
  id: string;
  short: string;
  full: string;
  url?: string;
}

export const SOURCES = {
  catalogo: {
    id: "catalogo",
    short: "Catálogo KOSMOS TIC y BU-TIC",
    full: "KOSMOS TIC S.A.S. y BU-TIC. Catálogo de productos y servicios (documento oficial de la empresa).",
  },
  web: {
    id: "web",
    short: "kosmostic.com",
    full: "KOSMOS TIC. Sitio web oficial.",
    url: "https://kosmostic.com",
  },
  ley2300: {
    id: "ley2300",
    short: "Ley 2300 de 2023",
    full: "Congreso de Colombia. Ley 2300 de 2023, por medio de la cual se establecen medidas que protejan el derecho a la intimidad de los consumidores.",
    url: "https://normograma.mintic.gov.co/docs/pdf/ley_2300_2023.pdf",
  },
  ley80: {
    id: "ley80",
    short: "Ley 80 de 1993 y Ley 1150 de 2007",
    full: "Congreso de Colombia. Estatuto General de Contratación de la Administración Pública (Ley 80 de 1993) y Ley 1150 de 2007.",
  },
  ley1474: {
    id: "ley1474",
    short: "Ley 1474 de 2011, art. 94",
    full: "Congreso de Colombia. Ley 1474 de 2011, artículo 94: modalidad de contratación de mínima cuantía.",
  },
  ley1672: {
    id: "ley1672",
    short: "Ley 1672 de 2013 (RAEE)",
    full: "Congreso de Colombia. Ley 1672 de 2013: política pública de gestión integral de residuos de aparatos eléctricos y electrónicos.",
  },
  ley1581: {
    id: "ley1581",
    short: "Ley 1581 de 2012",
    full: "Congreso de Colombia. Ley 1581 de 2012: régimen general de protección de datos personales.",
  },
  itil: { id: "itil", short: "ITIL 4", full: "AXELOS / PeopleCert. ITIL 4: prácticas de gestión de activos de TI y de servicios." },
  cobit: { id: "cobit", short: "COBIT 2019", full: "ISACA. COBIT 2019: marco de gobierno y gestión de la información y la tecnología." },
  iso55000: { id: "iso55000", short: "ISO 55000", full: "ISO 55000: gestión de activos — visión general, principios y terminología." },
  profesor: { id: "profesor", short: "Video del profesor", full: "José Castellanos. Explicación en video: Gestión de Recursos Tecnológicos." },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
