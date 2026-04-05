export interface TechnicalPageData {
  page: number;
  title: string;
  subtitle?: string;
  details: {
    label: string;
    value: string;
  }[];
  connections?: {
    terminal: string;
    wire: string;
    dest: string;
    desc: string;
  }[];
}

export const pageData: Record<number, TechnicalPageData> = {
  1: {
    page: 1,
    title: "CAPA DO PROJETO",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "CLIENTE", value: "VOTORANTIM CIMENTOS" },
      { label: "UNIDADE", value: "EDEALINA - GO" },
      { label: "PROJETO", value: "PROJETO DETALHADO - MOAGEM DE CIMENTO Z2" },
      { label: "N° DESENHO", value: "DI-A-20V093E-002" },
      { label: "REVISÃO", value: "02" },
      { label: "DATA", value: "26/01/2026" }
    ]
  },
  4: {
    page: 4,
    title: "SIMBOLOGIA ELÉTRICA",
    details: [
      { label: "DISPOSITIVOS", value: "MINI DISJUNTOR, FUSÍVEL, BOBINA" },
      { label: "MOTORES", value: "MOTOR DE INDUÇÃO TRIFÁSICO, VENTILADOR" },
      { label: "INSTRUMENTOS", value: "TEMPERATURA, NÍVEL, POSIÇÃO, PRESSÃO" }
    ]
  },
  6: {
    page: 6,
    title: "TÍPICO DE PARTIDA",
    subtitle: "LEGENDA TÉCNICA",
    details: [
      { label: "TENSÃO COMANDO", value: "100...240Vca" },
      { label: "POTÊNCIA", value: "XX,X kW" },
      { label: "CORRENTE", value: "XX,X A" }
    ],
    connections: [
      { terminal: "XT:1", wire: "1", dest: "BOTOEIRA", desc: "LIGA LOCAL" },
      { terminal: "XT:2", wire: "2", dest: "BOTOEIRA", desc: "EMERGÊNCIA LOCAL" },
      { terminal: "XT:3", wire: "3", dest: "BOTOEIRA", desc: "LIGADO" },
      { terminal: "PE", wire: "GND", dest: "TERRA", desc: "ATERRAMENTO" }
    ]
  },
  8: {
    page: 8,
    title: "G1L03 - SILO DE GESSO",
    subtitle: "CANHÕES DE AR",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.3" },
      { label: "CLP", value: "Z2CLP01" },
      { label: "PAINEL", value: "Z2RM6" }
    ],
    connections: [
      { terminal: "RM6-SL4:1", wire: "0,5A", dest: "G1L03XV1", desc: "COMANDO ABRE/FECHA" },
      { terminal: "RM6-SL4:3", wire: "0,5A", dest: "G1L03XV2", desc: "COMANDO ABRE/FECHA" }
    ]
  },
  9: {
    page: 9,
    title: "P1P111Q1 - FILTRO DE MANGAS",
    subtitle: "PAINEL DO FILTRO",
    details: [
      { label: "FABRICANTE", value: "SINOMA / JIEHUA HOLDINGS" },
      { label: "DESENHO N°", value: "ZMCC-70" },
      { label: "DATA", value: "08/02/2025" }
    ]
  },
  14: {
    page: 14,
    title: "MOTOR PRINCIPAL DO ELEVADOR DE CANECAS",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "CCM", value: "SU6.2-CCM-Z2-1" },
      { label: "GAVETA", value: "C1.1" },
      { label: "TÍPICO", value: "2.1-2" },
      { label: "ENDEREÇO IP", value: "100.68.27.101" },
      { label: "POTÊNCIA", value: "110,00 kW" }
    ]
  },
  18: {
    page: 18,
    title: "P1U21LSH - CHAVE DE NÍVEL",
    subtitle: "ENTUPIMENTO PÉ DO ELEVADOR",
    details: [
      { label: "TAG", value: "P1U21LSH" },
      { label: "LOCAL", value: "PÉ DO ELEVADOR" }
    ],
    connections: [
      { terminal: "12", wire: "NF", dest: "CLP", desc: "SINAL DE NÍVEL" },
      { terminal: "11", wire: "COM1", dest: "CLP", desc: "COMUM" }
    ]
  },
  22: {
    page: 22,
    title: "P1U21XT1 - TRANSMISSOR DE VIBRAÇÃO",
    subtitle: "MANCAL DO MOTOR PRINCIPAL",
    details: [
      { label: "FABRICANTE", value: "IFM" },
      { label: "MODELO", value: "EVC526" },
      { label: "SINAL", value: "4 a 20mA" }
    ]
  },
  65: {
    page: 65,
    title: "MOTOR DA CORREIA TRANSPORTADORA Z2J01",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "CCM", value: "SU6.2-CCM-Z2-1" },
      { label: "GAVETA", value: "C12.9" },
      { label: "TÍPICO", value: "2.1-2-E" },
      { label: "ENDEREÇO IP", value: "100.68.27.175" },
      { label: "POTÊNCIA", value: "18,50 kW" },
      { label: "CORRENTE", value: "32,90 A" }
    ],
    connections: [
      { terminal: "X1:1", wire: "101", dest: "Z2J01-S1:1", desc: "COMANDO LIGA" },
      { terminal: "X1:2", wire: "102", dest: "Z2J01-S1:2", desc: "RETORNO LIGA" },
      { terminal: "X1:3", wire: "103", dest: "Z2J01-H1:1", desc: "SINALIZAÇÃO LIGADO" },
      { terminal: "PE", wire: "GND", dest: "CARCAÇA", desc: "ATERRAMENTO" }
    ]
  },
  80: {
    page: 80,
    title: "MOTOR PRINCIPAL DO ELEVADOR DE CANECAS",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "CCM", value: "SU6.2-CCM-Z2-1" },
      { label: "GAVETA", value: "C5.1" },
      { label: "TÍPICO", value: "2.1-2" },
      { label: "ENDEREÇO IP", value: "100.68.27.132" },
      { label: "POTÊNCIA", value: "90,00 kW" },
      { label: "CORRENTE", value: "147,90 A" }
    ]
  },
  121: {
    page: 121,
    title: "MOINHO DE BOLAS - Z2M01",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO GERAL",
    details: [
      { label: "EQUIPAMENTO", value: "MOINHO DE BOLAS" },
      { label: "FABRICANTE", value: "FLSMIDTH" },
      { label: "CAPACIDADE", value: "150 t/h" },
      { label: "SALA ELÉTRICA", value: "SU6.1 - MT MOAGEM DE CIMENTO Z2" }
    ]
  },
  107: {
    page: 107,
    title: "BOMBA DE INJEÇÃO DE ÁGUA NO MOINHO",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "CCM", value: "SU6.2-CCM-Z2-1" },
      { label: "GAVETA", value: "C14.1" },
      { label: "TÍPICO", value: "5.0-B/1" },
      { label: "ENDEREÇO IP", value: "100.68.27.182" },
      { label: "POTÊNCIA", value: "4,00 kW" },
      { label: "CORRENTE", value: "7,50 A" }
    ]
  },
  129: {
    page: 129,
    title: "MOTOR PRINCIPAL DO MOINHO DE BOLAS",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.1 - MT MOAGEM DE CIMENTO Z2" },
      { label: "PAINEL", value: "SU6.1-MT-Z2-1" },
      { label: "TÍPICO", value: "ESPECIAL" },
      { label: "POTÊNCIA", value: "3400 kW" },
      { label: "TENSÃO", value: "4160 V" }
    ]
  },
  210: {
    page: 210,
    title: "VENTILADOR DO FILTRO DE MANGAS",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "CCM", value: "SU6.2-CCM-Z2-1" },
      { label: "GAVETA", value: "C7.2" },
      { label: "ENDEREÇO IP", value: "100.68.27.135" },
      { label: "POTÊNCIA", value: "200,00 kW" }
    ]
  },
  257: {
    page: 257,
    title: "VENTILADOR DO FILTRO DE MANGAS Z2P51",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "CCM", value: "SU6.2-CCM-Z2-1" },
      { label: "GAVETA", value: "C10.1" },
      { label: "ENDEREÇO IP", value: "100.68.27.30" },
      { label: "POTÊNCIA", value: "450,00 kW" },
      { label: "TENSÃO", value: "4160 V" }
    ],
    connections: [
      { terminal: "XT1:1", wire: "101", dest: "Z2P52-S1", desc: "COMANDO LIGA" },
      { terminal: "XT1:2", wire: "102", dest: "Z2P52-S1", desc: "RETORNO LIGA" },
      { terminal: "XT1:3", wire: "103", dest: "Z2P52-H1", desc: "SINALIZAÇÃO LIGADO" }
    ]
  },
  273: {
    page: 273,
    title: "SEPARADOR - Z2S01",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "SALA ELÉTRICA", value: "SU6.2 - BT MOAGEM DE CIMENTO Z2" },
      { label: "INVERSOR", value: "Z2S01-Q1" },
      { label: "POTÊNCIA", value: "160,00 kW" },
      { label: "ENDEREÇO IP", value: "100.68.27.150" }
    ]
  },
  348: {
    page: 348,
    title: "SISTEMA DE AR COMPRIMIDO - COMPRESSOR DE AR",
    subtitle: "DIAGRAMA DE INTERLIGAÇÃO",
    details: [
      { label: "EQUIPAMENTO", value: "COMPRESSOR DE AR" },
      { label: "TAG", value: "Z2H01Q1" },
      { label: "LOCAL", value: "SALA DE COMPRESSORES" }
    ]
  }
};
