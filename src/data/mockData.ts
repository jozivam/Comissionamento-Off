export interface EquipmentData {
  tag: string;
  description: string;
  manufacturer?: string;
  model?: string;
  range?: string;
  signalType?: string;
  ipAddress?: string;
  ccm?: string;
  gaveta?: string;
  power?: string;
  current?: string;
  rpm?: string;
  voltage?: string;
  frequency?: string;
  powerFactor?: string;
  serviceFactor?: string;
  motorConnection?: string;
  protectionDegree?: string;
  type: 'motor' | 'instrument' | 'botoeira';
  // Pre-filled fields from sources
  location?: string;
  instrumentType?: string;
  supplyVoltage?: string;
  inputSignal?: string;
  outputSignal?: string;
  opValue?: string;
}

export const mockData: EquipmentData[] = [
  {
    tag: 'Z2P32',
    description: 'MOTOR PRINCIPAL VENTILADOR DE TIRAGEM FILTRO DE MANGAS Z2P31',
    manufacturer: 'WEG',
    model: '3~ 315S/M-04',
    type: 'motor',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C7.2',
    ipAddress: '100.68.27.130',
    power: '160 kW',
    current: '248 A',
    rpm: '1790',
    voltage: '440 V',
    frequency: '60',
    powerFactor: '0.88',
    serviceFactor: '1.15',
    motorConnection: 'Triângulo',
    protectionDegree: 'IP55'
  },
  {
    tag: 'Z2P32M1BL1',
    description: 'BOTOEIRA LOCAL ACIONAMENTO MOTOR VENTILADOR DE TIRAGEM FILTRO DE MANGAS Z2P31',
    manufacturer: 'Simona',
    type: 'instrument', // Changed to instrument to use the new form fields
    instrumentType: 'Botoeira Local',
    location: 'Base do Motor',
    supplyVoltage: '24 VCC',
    inputSignal: 'Digital',
    outputSignal: 'Digital',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE1',
    description: 'SENSOR DE TEMPERATURA DO MOTOR - FASE R',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Enrolamento Motor',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE2',
    description: 'SENSOR DE TEMPERATURA DO MOTOR - FASE S',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Enrolamento Motor',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE3',
    description: 'SENSOR DE TEMPERATURA DO MOTOR - FASE T',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Enrolamento Motor',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE4',
    description: 'SENSOR DE TEMPERATURA MANCAL DO MOTOR - L.A',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Mancal L.A Motor',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE5',
    description: 'SENSOR DE TEMPERATURA MANCAL DO MOTOR - L.O.A',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Mancal L.O.A Motor',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1XT1',
    description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.A - RADIAL (SUPERIOR)',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 25mm/s',
    type: 'instrument',
    instrumentType: 'Vibração',
    location: 'Mancal L.A Motor',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA',
    opValue: 'Variável'
  },
  {
    tag: 'Z2J10',
    description: 'ELEVADOR DE CANECAS - Z2J10',
    type: 'motor',
    ipAddress: '100.68.31.197',
    ccm: 'SU7.1-CCM-P1-3',
    gaveta: '5G'
  },
  {
    tag: 'Z2J08',
    description: 'REGUEIRA DE SAÍDA DO MOINHO - Z2J08',
    type: 'motor'
  },
  {
    tag: 'Z2J08LSH',
    description: 'NÍVEL ALTO - REGUEIRA DE SAÍDA DO MOINHO',
    manufacturer: 'VEGA',
    model: 'VEGAVIB63',
    range: '150mm - 300mm',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2J08',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2J10LSH',
    description: 'NÍVEL ALTO - ELEVADOR DE CANECAS',
    manufacturer: 'E+H',
    model: 'FTE20-AA11AA31',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2J10',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2J10M2SE',
    description: 'SENSOR DO MOTOR AUXILIAR VIGIA DE VELOCIDADE',
    manufacturer: 'IFM',
    model: 'IG5497+ECV004 DD0203',
    type: 'instrument',
    instrumentType: 'SENSOR INDUTIVO NAMUR',
    location: 'Z2J10',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2J10SE1',
    description: 'SENSOR 1 - PÉ DO ELEVADOR VIGIA DE VELOCIDADE',
    manufacturer: 'Schneider',
    model: 'XSAV11801',
    type: 'instrument',
    instrumentType: 'SENSOR INDUTIVO DE PROXIMIDADE',
    location: 'Z2J10',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2J10TSH',
    description: 'TEMPERATURA ÓLEO ACOPLAMENTO ELEVADOR',
    manufacturer: 'Schneider',
    model: 'XCMD2102L1',
    type: 'instrument',
    instrumentType: 'SENSOR TEMPERATURA',
    location: 'Z2J10',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2J10XT1',
    description: 'VIBRAÇÃO DO MANCAL DO MOTOR',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0 mm/s - 25 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2J10',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2J10M1TE1',
    description: 'TEMPERATURA FASE R',
    manufacturer: 'SIEMENS',
    model: 'PENDENTE SINOMA',
    type: 'instrument',
    instrumentType: 'Motor Winding Temperature',
    location: 'Z2J10',
    inputSignal: 'PT100'
  },
  {
    tag: 'Z2J18',
    description: 'ELEVADOR DE CANECAS - Z2J18',
    type: 'motor',
    ipAddress: '100.68.27.139',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.4'
  },
  {
    tag: 'Z2J18LSH',
    description: 'NÍVEL ALTO - ELEVADOR DE CANECAS',
    manufacturer: 'E+H',
    model: 'FTE20-AA11AA31',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2J18',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2J18M1TSH',
    description: 'TEMPERATURA ÓLEO ACOPLAMENTO ELEVADOR',
    manufacturer: 'Schneider',
    model: 'XCMD2102L1',
    type: 'instrument',
    instrumentType: 'SENSOR TEMPERATURA',
    location: 'Z2J18',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2M01',
    description: 'MOINHO DE BOLAS - Z2M01',
    type: 'motor'
  },
  {
    tag: 'Z2M01TE1',
    description: 'TEMPERATURA DE SAÍDA',
    manufacturer: 'SIEMENS',
    model: '7MC5516-1LA34-0BA2',
    range: '0°C - 400°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2M01',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'P1P112M1',
    description: 'MOTOR DO EXAUSTOR DO FILTRO P1P111',
    type: 'motor',
    ipAddress: '100.68.31.197',
    ccm: 'SU7.1-CCM-P1-3',
    gaveta: '5G'
  },
  {
    tag: 'P1P113M1',
    description: 'MOTOR DA VÁLVULA ROTATIVA DO FILTRO P1P111',
    type: 'motor',
    ipAddress: '100.68.31.178',
    ccm: 'SU7.1-CCM-P1-3',
    gaveta: '3C'
  },
  {
    tag: 'P1U21M1',
    description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.31.181',
    ccm: 'SU7.1-CCM-P1-3',
    gaveta: '3F'
  },
  {
    tag: 'P1U21M2',
    description: 'ACIONAMENTO AUXILIAR DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.31.192',
    ccm: 'SU7.1-CCM-P1-3',
    gaveta: '5A'
  },
  {
    tag: 'Z2U11M1',
    description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.31.179',
    ccm: 'SU7.1-CCM-P1-3',
    gaveta: '3D'
  },
  {
    tag: 'Z2A01Q1',
    description: 'ALIMENTAÇÃO DO PAINEL DA BALANÇA DOSADORA DE CLINQUER',
    type: 'motor',
    ipAddress: '100.68.27.132',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C12.7'
  },
  {
    tag: 'Z2B01Q1',
    description: 'ALIMENTAÇÃO DO PAINEL DA BALANÇA DOSADORA DE GESSO',
    type: 'motor',
    ipAddress: '100.68.27.130',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C12.5'
  },
  {
    tag: 'Z2C01Q1',
    description: 'ALIMENTAÇÃO DO PAINEL DA BALANÇA DOSADORA DE CALCÁRIO',
    type: 'motor',
    ipAddress: '100.68.27.130',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C12.4'
  },
  {
    tag: 'Z2J01M1',
    description: 'MOTOR DA CORREIA TRANSPORTADORA Z2J01',
    type: 'motor',
    ipAddress: '100.68.27.175',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C12.9'
  },
  {
    tag: 'Z2J02M1',
    description: 'MOTOR DA CORREIA TRANSPORTADORA Z2J02',
    type: 'motor',
    ipAddress: '100.68.27.181',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C13.5'
  },
  {
    tag: 'Z2J04M1',
    description: 'MOTOR DA ROSCA TRANSPORTADORA Z2J04',
    type: 'motor',
    ipAddress: '100.68.27.179',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C13.3'
  },
  {
    tag: 'Z2J09M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J08',
    type: 'motor',
    ipAddress: '100.68.27.128',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C4.8'
  },
  {
    tag: 'Z2J12M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J11',
    type: 'motor',
    ipAddress: '100.68.27.133',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C5.2'
  },
  {
    tag: 'Z2J15M1',
    description: 'MOTOR DO VENTILADOR DAS REGUEIRAS Z2J13 E Z2J14',
    type: 'motor',
    ipAddress: '100.68.27.134',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C5.3'
  },
  {
    tag: 'Z2J17M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J19',
    type: 'motor',
    ipAddress: '100.68.27.138',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.3'
  },
  {
    tag: 'Z2J18M1',
    description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.27.139',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.4'
  },
  {
    tag: 'Z2J32M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J31',
    type: 'motor',
    ipAddress: '100.68.27.150',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C7.7'
  },
  {
    tag: 'Z2J33M1',
    description: 'MOTOR DA VÁLVULA ROTATIVA Z2J33',
    type: 'motor',
    ipAddress: '100.68.27.147',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C7.4'
  },
  {
    tag: 'Z2J34M1',
    description: 'MOTOR DA ROSCA TRANSPORTADORA Z2J34',
    type: 'motor',
    ipAddress: '100.68.27.149',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C7.6'
  },
  {
    tag: 'Z2K02M1',
    description: 'BOMBA DE INJEÇÃO DE ÁGUA NO MOINHO',
    type: 'motor',
    ipAddress: '100.68.27.182',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C14.1'
  },
  {
    tag: 'Z2K03M1',
    description: 'BOMBA DE INJEÇÃO DE ÁGUA NO MOINHO',
    type: 'motor',
    ipAddress: '100.68.27.183',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C14.2'
  },
  {
    tag: 'Z2K06M1',
    description: 'MOTOR DO VENTILADOR DA TORRE ALPINA',
    type: 'motor',
    ipAddress: '100.68.27.123',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C4.3'
  },
  {
    tag: 'Z2K07M1',
    description: 'MOTOR DA BOMBA 1 DA TORRE ALPINA',
    type: 'motor',
    ipAddress: '100.68.27.135',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C5.4'
  },
  {
    tag: 'Z2K08M1',
    description: 'MOTOR DA BOMBA 2 DA TORRE ALPINA',
    type: 'motor',
    ipAddress: '100.68.27.167',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.4'
  },
  {
    tag: 'Z2M03M1',
    description: 'MOTOR PRINCIPAL DO MOINHO DE BOLAS',
    type: 'motor',
    ccm: 'SU6.4-QDMT-001',
    gaveta: 'C4'
  },
  {
    tag: 'Z2M04M1',
    description: 'MOTOR DO GIRO LENTO DO MOINHO DE BOLAS',
    type: 'motor',
    ipAddress: '100.68.27.101',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C2.1'
  },
  {
    tag: 'Z2M06M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 1',
    type: 'motor',
    ipAddress: '100.68.27.105',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C2.5'
  },
  {
    tag: 'Z2M07M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 2',
    type: 'motor',
    ipAddress: '100.68.27.106',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C2.6'
  },
  {
    tag: 'Z2M08M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 1',
    type: 'motor',
    ipAddress: '100.68.27.102',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C2.2'
  },
  {
    tag: 'Z2M09M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 2',
    type: 'motor',
    ipAddress: '100.68.27.103',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C2.3'
  },
  {
    tag: 'Z2M11M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 1',
    type: 'motor',
    ipAddress: '100.68.27.114',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C3.5'
  },
  {
    tag: 'Z2M12M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 2',
    type: 'motor',
    ipAddress: '100.68.27.115',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C3.6'
  },
  {
    tag: 'Z2M13M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 1',
    type: 'motor',
    ipAddress: '100.68.27.111',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C3.2'
  },
  {
    tag: 'Z2M14M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 2',
    type: 'motor',
    ipAddress: '100.68.27.112',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C3.3'
  },
  {
    tag: 'Z2M15M1',
    description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 1',
    type: 'motor',
    ipAddress: '100.68.27.121',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C4.1'
  },
  {
    tag: 'Z2M15M2',
    description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 2',
    type: 'motor',
    ipAddress: '100.68.27.122',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C4.2'
  },
  {
    tag: 'Z2P12M1',
    description: 'MOTOR DO EXAUSTOR DO FILTRO Z2P11',
    type: 'motor',
    ipAddress: '100.68.27.177',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C13.1'
  },
  {
    tag: 'Z2P22M1',
    description: 'MOTOR DO EXAUSTOR DO FILTRO Z2P22',
    type: 'motor',
    ipAddress: '100.68.27.180',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C13.4'
  },
  {
    tag: 'Z2U02M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U01',
    type: 'motor',
    ipAddress: '100.68.27.145',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.10'
  },
  {
    tag: 'Z2U04M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U03',
    type: 'motor',
    ipAddress: '100.68.27.144',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.9'
  },
  {
    tag: 'Z2U05M1',
    description: 'MOTOR DA VÁLVULA ROTATIVA Z2U05',
    type: 'motor',
    ipAddress: '100.68.27.143',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.8'
  },
  {
    tag: 'Z2U06M1',
    description: 'MOTOR DA VÁLVULA ROTATIVA Z2U06',
    type: 'motor',
    ipAddress: '100.68.27.142',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.7'
  },
  {
    tag: 'Z2U10M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U09',
    type: 'motor',
    ipAddress: '100.68.27.146',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C7.1'
  },
  {
    tag: 'Z2U11M1',
    description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.27.161',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C10.9'
  },
  {
    tag: 'Z2U11M2',
    description: 'ACIONAMENTO AUXILIAR DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.27.162',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C10.10'
  },
  {
    tag: 'Z2U13M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U12',
    type: 'motor',
    ipAddress: '100.68.27.168',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.5'
  },
  {
    tag: 'Z2U14M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U12',
    type: 'motor',
    ipAddress: '100.68.27.169',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.6'
  },
  {
    tag: 'Z2U16M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U15',
    type: 'motor',
    ipAddress: '100.68.27.170',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.7'
  },
  {
    tag: 'Z2U17M1',
    description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U15',
    type: 'motor',
    ipAddress: '100.68.27.171',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.8'
  },
  {
    tag: 'Z2J18M2',
    description: 'ACIONAMENTO AUXILIAR DO ELEVADOR DE CANECAS',
    type: 'motor',
    ipAddress: '100.68.27.141',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C6.6'
  },
  {
    tag: 'Z2P32M1XT2',
    description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.A - AXIAL',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 25mm/s',
    type: 'instrument',
    instrumentType: 'Vibração',
    location: 'Mancal L.A Motor',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1XT3',
    description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.O.A - RADIAL (SUPERIOR)',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 25mm/s',
    type: 'instrument',
    instrumentType: 'Vibração',
    location: 'Mancal L.O.A Motor',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1XT4',
    description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.O.A - AXIAL',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 25mm/s',
    type: 'instrument',
    instrumentType: 'Vibração',
    location: 'Mancal L.O.A Motor',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE6',
    description: 'SENSOR DE TEMPERATURA MANCAL DO VENTILADOR - L.A',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Mancal L.A Ventilador',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TE7',
    description: 'SENSOR DE TEMPERATURA MANCAL DO VENTILADOR - L.O.A',
    manufacturer: 'Keliang',
    model: 'WZP2*2B-3*2000',
    range: '0ºC - 200ºC',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Mancal L.O.A Ventilador',
    inputSignal: 'Resistência',
    outputSignal: '4-20 mA (via Transmissor)',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1PDT1',
    description: 'TRANSMISSOR DE PRESSÃO DIFERENCIAL DO FILTRO DE MANGAS',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 5000 Pa',
    type: 'instrument',
    instrumentType: 'Pressão Diferencial',
    location: 'Filtro de Mangas',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA / HART',
    opValue: 'Variável'
  },
  {
    tag: 'Z2M03TE1',
    description: 'SENSOR DE TEMPERATURA MANCAL DO MOINHO - L.A',
    manufacturer: 'Keliang',
    type: 'instrument',
    range: '0-100ºC'
  },
  {
    tag: 'Z2M03TE2',
    description: 'SENSOR DE TEMPERATURA MANCAL DO MOINHO - L.O.A',
    manufacturer: 'Keliang',
    type: 'instrument',
    range: '0-100ºC'
  },
  {
    tag: 'Z2P42M1',
    description: 'MOTOR DO EXAUSTOR DO FILTRO Z2P41',
    type: 'motor',
    ipAddress: '100.68.27.165',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.2'
  },
  {
    tag: 'Z2P43M1',
    description: 'MOTOR DA VÁLVULA ROTATIVA Z2P43',
    type: 'motor',
    ipAddress: '100.68.27.163',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C10.11'
  },
  {
    tag: 'Z2P52',
    description: 'MOTOR VENTILADOR DO FILTRO DE MANGAS - Z2P52',
    type: 'motor',
    ipAddress: '100.68.27.30',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C10.1'
  },
  {
    tag: 'Z2P52M1TE1',
    description: 'TEMPERATURA ENROLAMENTO DO ESTATOR DO MOTOR - FASE R1',
    manufacturer: 'PENDENTE SINOMA',
    model: 'PENDENTE SINOMA',
    range: '0°C - 200°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52M1TE2',
    description: 'TEMPERATURA ENROLAMENTO DO ESTATOR DO MOTOR - FASE S1',
    manufacturer: 'PENDENTE SINOMA',
    model: 'PENDENTE SINOMA',
    range: '0°C - 200°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52M1TE3',
    description: 'TEMPERATURA ENROLAMENTO DO ESTATOR DO MOTOR - FASE T1',
    manufacturer: 'PENDENTE SINOMA',
    model: 'PENDENTE SINOMA',
    range: '0°C - 200°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52M1TE4',
    description: 'TEMPERATURA MANCAL DO MOTOR DO VENTILADOR - L.A',
    manufacturer: 'PENDENTE SINOMA',
    model: 'PENDENTE SINOMA',
    range: '0°C - 100°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52M1TE5',
    description: 'TEMPERATURA MANCAL DO MOTOR DO VENTILADOR - L.O.A',
    manufacturer: 'PENDENTE SINOMA',
    model: 'PENDENTE SINOMA',
    range: '0°C - 100°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52M1XT1',
    description: 'VIBRAÇÃO MANCAL DO MOTOR L.A - RADIAL',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 25 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52M1XT2',
    description: 'VIBRAÇÃO MANCAL DO MOTOR L.A - AXIAL',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 10 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52M1XT3',
    description: 'VIBRAÇÃO MANCAL DO MOTOR L.O.A',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 10 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52TE1',
    description: 'TEMPERATURA MANCAL DO VENTILADOR - L.A',
    manufacturer: 'Siemens',
    model: '7MC5500',
    range: '0°C - 100°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52TE2',
    description: 'TEMPERATURA MANCAL DO VENTILADOR - L.O.A',
    manufacturer: 'Siemens',
    model: '7MC5500',
    range: '0°C - 100°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52XT1',
    description: 'VIBRAÇÃO 1 MANCAL DO VENTILADOR - L.A',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 10 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52XT2',
    description: 'VIBRAÇÃO 2 MANCAL DO VENTILADOR - L.A',
    manufacturer: 'IFM',
    model: 'VTV122',
    range: '0mm/s - 10 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52XT3',
    description: 'VIBRAÇÃO 1 MANCAL DO VENTILADOR - L.O.A',
    manufacturer: 'PEGAR MODELO NO Z10',
    model: 'PEGAR MODELO NO Z10',
    range: '0mm/s - 10 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52XT4',
    description: 'VIBRAÇÃO 2 MANCAL DO VENTILADOR - L.O.A',
    manufacturer: 'PEGAR MODELO NO Z10',
    model: 'PEGAR MODELO NO Z10',
    range: '0mm/s - 10 mm/s',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VIBRAÇÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52LSH1',
    description: 'NÍVEL ALTO 1 - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P52',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P52LSH2',
    description: 'NÍVEL ALTO 2 - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P52',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P52LSH3',
    description: 'NÍVEL ALTO 3 - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P52',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P52LSH4',
    description: 'NÍVEL ALTO 4 - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P52',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P52LSH5',
    description: 'NÍVEL ALTO 5 - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P52',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P52LSH6',
    description: 'NÍVEL ALTO 6 - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P52',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P52PDT',
    description: 'PRESSÃO DIFERENCIAL - FILTRO DE MANGAS Z2P51',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 5000 Pa',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO DIFERENCIAL',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52PT1',
    description: 'PRESSÃO NA ENTRADA - FILTRO DE MANGAS Z2P51',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 10 kPa',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52PT2',
    description: 'PRESSÃO NA SAÍDA - FILTRO DE MANGAS Z2P51',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 10 kPa',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52PT3',
    description: 'PRESSÃO AR COMPRIMIDO - FILTRO DE MANGAS Z2P51',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 10 bar',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52Q1',
    description: 'CONCENTRAÇÃO DE PÓ - FILTRO DE MANGAS Z2P51',
    manufacturer: 'SICK',
    model: 'DUSTHUNTER SB30',
    type: 'instrument',
    instrumentType: 'ANALISADOR DE PÓ',
    location: 'Z2P52',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P52TE3',
    description: 'TEMPERATURA NA ENTRADA - FILTRO DE MANGAS Z2P51',
    manufacturer: 'Siemens',
    model: '7MC5500',
    range: '0°C - 200°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P52TE4',
    description: 'TEMPERATURA NA SAÍDA - FILTRO DE MANGAS Z2P51',
    manufacturer: 'Siemens',
    model: '7MC5500',
    range: '0°C - 200°C',
    type: 'instrument',
    instrumentType: 'PT-100',
    location: 'Z2P52',
    inputSignal: 'RESISTÊNCIA'
  },
  {
    tag: 'Z2P62',
    description: 'MOTOR VENTILADOR DO FILTRO DE MANGAS - Z2P62',
    type: 'motor',
    ipAddress: '100.68.27.172',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.9'
  },
  {
    tag: 'Z2P62PDT',
    description: 'PRESSÃO DIFERENCIAL - FILTRO DE MANGAS Z2P61',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 5000 Pa',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO DIFERENCIAL',
    location: 'Z2P62',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P72',
    description: 'MOTOR VENTILADOR DO FILTRO DE MANGAS - Z2P72',
    type: 'motor',
    ipAddress: '100.68.27.174',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.11'
  },
  {
    tag: 'Z2P72PDT',
    description: 'PRESSÃO DIFERENCIAL - FILTRO DE MANGAS Z2P71',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 5000 Pa',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO DIFERENCIAL',
    location: 'Z2P72',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P73M1',
    description: 'MOTOR DA VÁLVULA ROTATIVA Z2P73',
    type: 'motor',
    ipAddress: '100.68.27.173',
    ccm: 'SU6.2-CCM-Z2-1',
    gaveta: 'C11.10'
  },
  {
    tag: 'Z2P32M1PT1',
    description: 'TRANSMISSOR DE PRESSÃO NA ENTRADA DO FILTRO',
    manufacturer: 'Rosemount',
    type: 'instrument',
    instrumentType: 'Pressão',
    location: 'Duto de Entrada',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA / HART',
    range: '0-10 kPa',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32M1TT1',
    description: 'TRANSMISSOR DE TEMPERATURA NA ENTRADA DO FILTRO',
    manufacturer: 'Rosemount',
    type: 'instrument',
    instrumentType: 'Temperatura',
    location: 'Duto de Entrada',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA / HART',
    range: '0-150ºC',
    opValue: 'Variável'
  },
  {
    tag: 'Z2P32LSH1',
    description: 'NÍVEL ALTO 1 - FILTRO DE MANGAS Z2P31',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P32',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P32LSH2',
    description: 'NÍVEL ALTO 2 - FILTRO DE MANGAS Z2P31',
    manufacturer: 'SUPMEA',
    model: 'SUP-P260',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL',
    location: 'Z2P32',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2P32Q1',
    description: 'CONCENTRAÇÃO DE PÓ - FILTRO DE MANGAS Z2P31',
    manufacturer: 'SICK',
    model: 'DUSTHUNTER SB30',
    type: 'instrument',
    instrumentType: 'ANALISADOR DE PÓ',
    location: 'Z2P32',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P32PT2',
    description: 'PRESSÃO NA SAÍDA - FILTRO DE MANGAS Z2P31',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 10 kPa',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO',
    location: 'Z2P32',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2P32PT3',
    description: 'PRESSÃO AR COMPRIMIDO - FILTRO DE MANGAS Z2P31',
    manufacturer: 'Rosemount',
    model: '3051S',
    range: '0 - 10 bar',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO',
    location: 'Z2P32',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2K01',
    description: 'SISTEMA DE INJEÇÃO DE ÁGUA PARA MOINHO - Z2K01',
    type: 'motor'
  },
  {
    tag: 'Z2K01FT1',
    description: 'VAZÃO DE ÁGUA DO SISTEMA DE INJEÇÃO DE ÁGUA PARA MOINHO',
    manufacturer: 'SIEMENS',
    model: 'SITRANS FM MAG 5100 W',
    range: '0 m3/h - 15 m3/h',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE VAZÃO',
    location: 'Z2K01',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2K01LSH',
    description: 'NÍVEL ALTO DO TANQUE DE ÁGUA',
    manufacturer: 'SUPMEA',
    model: 'P260-B',
    type: 'instrument',
    instrumentType: 'CHAVE DE NÍVEL TIPO BOIA',
    location: 'Z2K01',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2K01PT1',
    description: 'PRESSÃO DE ÁGUA DO SISTEMA DE INJEÇÃO DE ÁGUA PARA MOINHO',
    manufacturer: 'SIEMENS',
    model: '7MF0350-1G01-5BFO-Z',
    range: '0 bar - 2,5 bar',
    type: 'instrument',
    instrumentType: 'TRANSMISSOR DE PRESSÃO',
    location: 'Z2K01',
    supplyVoltage: '4-20 mA'
  },
  {
    tag: 'Z2K01XV',
    description: 'COMANDO ABRE / FECHA',
    manufacturer: 'RUNFLOW',
    model: 'BV21DP02F3P21 solenoid valve：ASCO SCG551A001MS',
    type: 'instrument',
    instrumentType: 'VÁLVULA SOLENOIDE',
    location: 'Z2K01',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2K01ZSH',
    description: 'POSIÇÃO ABERTA',
    manufacturer: 'RUNFLOW',
    model: 'BOX:ALS-200M2',
    type: 'instrument',
    instrumentType: 'SENSOR INDUTIVO DE PROXIMIDADE',
    location: 'Z2K01',
    supplyVoltage: '120Vca'
  },
  {
    tag: 'Z2K01FT1',
    description: 'TRANSMISSOR DE VAZÃO VAZÃO DE ÁGUA NA CÂMARA 2 DO MOINHO',
    manufacturer: 'Votorantim',
    model: '571WS01.FZ1',
    type: 'instrument',
    instrumentType: 'Vazão Eletromagnética',
    location: 'Tubulação de Água',
    supplyVoltage: '24 VCC',
    outputSignal: '4-20 mA',
    range: '0 - 50 m³/h',
    opValue: 'Variável'
  },
  {
    tag: 'Z2K06LSL',
    description: 'CHAVE DE NIVEL NÍVEL BAIXO DE ÁGUA',
    type: 'instrument',
    instrumentType: 'Chave de Nível',
    location: 'Tanque de Água',
    supplyVoltage: '24 VCC',
    outputSignal: 'Digital (Contato Seco)',
    opValue: 'Variável'
  }
];
