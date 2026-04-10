/**
 * Seed Supabase com dados do projeto (mockData)
 * Uso: node scripts/seed-supabase.mjs
 *
 * Pré-requisitos:
 *   npm install @supabase/supabase-js
 *   Ou: node --require=... (usa a versão já instalada no projeto)
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── Configuração ────────────────────────────────────────────────────────────
const SUPABASE_URL   = 'https://cbwfpuuubknvkioosaip.supabase.co';
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNid2ZwdXV1Ymtudmtpb29zYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTkwOTUsImV4cCI6MjA5MTMzNTA5NX0.Ft6JVh8VfWlcq5CsEDdlefwv45pPvzGk2csx16e4YDM';
const USER_ID        = 'seed-script';
const USER_EMAIL     = 'seed@projeto.com';
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função auxiliar: detecta o equipamento pai de um instrumento
function getMainTag(tag) {
  // TAGs de motores terminam em M1, M2, etc  — instrumentos têm sufixos como TE1, XT1, PDT1, SE, LSH, TSH
  // Heurística: remove o sufixo de instrumento (letras+números ao final após o motor)
  // Ex: Z2P32M1TE1 → Z2P32M1  |  Z2J08LSH → Z2J08  |  Z2J10M1TE1 → Z2J10
  const match = tag.match(/^(.+M\d+)[A-Z]+\d*$/) ||  // Z2P32M1TE1 → Z2P32M1
                tag.match(/^(\w+?)[A-Z]{2,}[HNS\d]+$/); // Z2J08LSH → Z2J08
  return match ? match[1] : tag;
}

// ─── Dados do projeto (copiados de mockData.ts) ───────────────────────────
const mockData = [
  { tag: 'Z2P32', description: 'MOTOR PRINCIPAL VENTILADOR DE TIRAGEM FILTRO DE MANGAS Z2P31', manufacturer: 'WEG', model: '3~ 315S/M-04', type: 'motor', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C7.2', ipAddress: '100.68.27.130', power: '160 kW', current: '248 A', rpm: '1790', voltage: '440 V', frequency: '60', powerFactor: '0.88', serviceFactor: '1.15', motorConnection: 'Triângulo', protectionDegree: 'IP55' },
  { tag: 'Z2P32M1BL1', description: 'BOTOEIRA LOCAL ACIONAMENTO MOTOR VENTILADOR DE TIRAGEM FILTRO DE MANGAS Z2P31', manufacturer: 'Simona', type: 'instrument', instrumentType: 'Botoeira Local', location: 'Base do Motor', supplyVoltage: '24 VCC', inputSignal: 'Digital', outputSignal: 'Digital', opValue: 'Variável' },
  { tag: 'Z2P32M1TE1', description: 'SENSOR DE TEMPERATURA DO MOTOR - FASE R', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Enrolamento Motor', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1TE2', description: 'SENSOR DE TEMPERATURA DO MOTOR - FASE S', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Enrolamento Motor', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1TE3', description: 'SENSOR DE TEMPERATURA DO MOTOR - FASE T', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Enrolamento Motor', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1TE4', description: 'SENSOR DE TEMPERATURA MANCAL DO MOTOR - L.A', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Mancal L.A Motor', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1TE5', description: 'SENSOR DE TEMPERATURA MANCAL DO MOTOR - L.O.A', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Mancal L.O.A Motor', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1XT1', description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.A - RADIAL (SUPERIOR)', manufacturer: 'IFM', model: 'VTV122', range: '0mm/s - 25mm/s', type: 'instrument', instrumentType: 'Vibração', location: 'Mancal L.A Motor', supplyVoltage: '24 VCC', outputSignal: '4-20 mA', opValue: 'Variável' },
  { tag: 'Z2P32M1XT2', description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.A - AXIAL', manufacturer: 'IFM', model: 'VTV122', range: '0mm/s - 25mm/s', type: 'instrument', instrumentType: 'Vibração', location: 'Mancal L.A Motor', supplyVoltage: '24 VCC', outputSignal: '4-20 mA', opValue: 'Variável' },
  { tag: 'Z2P32M1XT3', description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.O.A - RADIAL (SUPERIOR)', manufacturer: 'IFM', model: 'VTV122', range: '0mm/s - 25mm/s', type: 'instrument', instrumentType: 'Vibração', location: 'Mancal L.O.A Motor', supplyVoltage: '24 VCC', outputSignal: '4-20 mA', opValue: 'Variável' },
  { tag: 'Z2P32M1XT4', description: 'TRANSMISSOR DE VIBRAÇÃO MANCAL DO MOTOR L.O.A - AXIAL', manufacturer: 'IFM', model: 'VTV122', range: '0mm/s - 25mm/s', type: 'instrument', instrumentType: 'Vibração', location: 'Mancal L.O.A Motor', supplyVoltage: '24 VCC', outputSignal: '4-20 mA', opValue: 'Variável' },
  { tag: 'Z2P32M1TE6', description: 'SENSOR DE TEMPERATURA MANCAL DO VENTILADOR - L.A', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Mancal L.A Ventilador', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1TE7', description: 'SENSOR DE TEMPERATURA MANCAL DO VENTILADOR - L.O.A', manufacturer: 'Keliang', model: 'WZP2*2B-3*2000', range: '0ºC - 200ºC', type: 'instrument', instrumentType: 'PT-100', location: 'Mancal L.O.A Ventilador', inputSignal: 'Resistência', outputSignal: '4-20 mA (via Transmissor)', opValue: 'Variável' },
  { tag: 'Z2P32M1PDT1', description: 'TRANSMISSOR DE PRESSÃO DIFERENCIAL DO FILTRO DE MANGAS', manufacturer: 'Rosemount', model: '3051S', range: '0 - 5000 Pa', type: 'instrument', instrumentType: 'Pressão Diferencial', location: 'Filtro de Mangas', supplyVoltage: '24 VCC', outputSignal: '4-20 mA / HART', opValue: 'Variável' },
  { tag: 'Z2J08', description: 'REGUEIRA DE SAÍDA DO MOINHO - Z2J08', type: 'motor' },
  { tag: 'Z2J08LSH', description: 'NÍVEL ALTO - REGUEIRA DE SAÍDA DO MOINHO', manufacturer: 'VEGA', model: 'VEGAVIB63', range: '150mm - 300mm', type: 'instrument', instrumentType: 'CHAVE DE NÍVEL', location: 'Z2J08', supplyVoltage: '120Vca' },
  { tag: 'Z2J10', description: 'ELEVADOR DE CANECAS - Z2J10', type: 'motor', ipAddress: '100.68.31.197', ccm: 'SU7.1-CCM-P1-3', gaveta: '5G' },
  { tag: 'Z2J10LSH', description: 'NÍVEL ALTO - ELEVADOR DE CANECAS', manufacturer: 'E+H', model: 'FTE20-AA11AA31', type: 'instrument', instrumentType: 'CHAVE DE NÍVEL', location: 'Z2J10', supplyVoltage: '120Vca' },
  { tag: 'Z2J10M2SE', description: 'SENSOR DO MOTOR AUXILIAR VIGIA DE VELOCIDADE', manufacturer: 'IFM', model: 'IG5497+ECV004 DD0203', type: 'instrument', instrumentType: 'SENSOR INDUTIVO NAMUR', location: 'Z2J10', supplyVoltage: '120Vca' },
  { tag: 'Z2J10SE1', description: 'SENSOR 1 - PÉ DO ELEVADOR VIGIA DE VELOCIDADE', manufacturer: 'Schneider', model: 'XSAV11801', type: 'instrument', instrumentType: 'SENSOR INDUTIVO DE PROXIMIDADE', location: 'Z2J10', supplyVoltage: '120Vca' },
  { tag: 'Z2J10TSH', description: 'TEMPERATURA ÓLEO ACOPLAMENTO ELEVADOR', manufacturer: 'Schneider', model: 'XCMD2102L1', type: 'instrument', instrumentType: 'SENSOR TEMPERATURA', location: 'Z2J10', supplyVoltage: '120Vca' },
  { tag: 'Z2J10XT1', description: 'VIBRAÇÃO DO MANCAL DO MOTOR', manufacturer: 'IFM', model: 'VTV122', range: '0 mm/s - 25 mm/s', type: 'instrument', instrumentType: 'TRANSMISSOR DE VIBRAÇÃO', location: 'Z2J10', supplyVoltage: '4-20 mA' },
  { tag: 'Z2J10M1TE1', description: 'TEMPERATURA FASE R', manufacturer: 'SIEMENS', model: 'PENDENTE SINOMA', type: 'instrument', instrumentType: 'Motor Winding Temperature', location: 'Z2J10', inputSignal: 'PT100' },
  { tag: 'Z2J18', description: 'ELEVADOR DE CANECAS - Z2J18', type: 'motor', ipAddress: '100.68.27.139', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.4' },
  { tag: 'Z2J18LSH', description: 'NÍVEL ALTO - ELEVADOR DE CANECAS', manufacturer: 'E+H', model: 'FTE20-AA11AA31', type: 'instrument', instrumentType: 'CHAVE DE NÍVEL', location: 'Z2J18', supplyVoltage: '120Vca' },
  { tag: 'Z2J18M1TSH', description: 'TEMPERATURA ÓLEO ACOPLAMENTO ELEVADOR', manufacturer: 'Schneider', model: 'XCMD2102L1', type: 'instrument', instrumentType: 'SENSOR TEMPERATURA', location: 'Z2J18', supplyVoltage: '120Vca' },
  { tag: 'Z2M01', description: 'MOINHO DE BOLAS - Z2M01', type: 'motor' },
  { tag: 'Z2M01TE1', description: 'TEMPERATURA DE SAÍDA', manufacturer: 'SIEMENS', model: '7MC5516-1LA34-0BA2', range: '0°C - 400°C', type: 'instrument', instrumentType: 'PT-100', location: 'Z2M01', inputSignal: 'RESISTÊNCIA' },
  { tag: 'Z2M03M1', description: 'MOTOR PRINCIPAL DO MOINHO DE BOLAS', type: 'motor', ccm: 'SU6.4-QDMT-001', gaveta: 'C4' },
  { tag: 'Z2M03TE1', description: 'SENSOR DE TEMPERATURA MANCAL DO MOINHO - L.A', manufacturer: 'Keliang', type: 'instrument', range: '0-100ºC' },
  { tag: 'Z2M03TE2', description: 'SENSOR DE TEMPERATURA MANCAL DO MOINHO - L.O.A', manufacturer: 'Keliang', type: 'instrument', range: '0-100ºC' },
  { tag: 'Z2M04M1', description: 'MOTOR DO GIRO LENTO DO MOINHO DE BOLAS', type: 'motor', ipAddress: '100.68.27.101', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C2.1' },
  { tag: 'Z2J01M1', description: 'MOTOR DA CORREIA TRANSPORTADORA Z2J01', type: 'motor', ipAddress: '100.68.27.175', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C12.9' },
  { tag: 'Z2J02M1', description: 'MOTOR DA CORREIA TRANSPORTADORA Z2J02', type: 'motor', ipAddress: '100.68.27.181', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C13.5' },
  { tag: 'Z2J04M1', description: 'MOTOR DA ROSCA TRANSPORTADORA Z2J04', type: 'motor', ipAddress: '100.68.27.179', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C13.3' },
  { tag: 'Z2J09M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J08', type: 'motor', ipAddress: '100.68.27.128', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C4.8' },
  { tag: 'Z2J12M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J11', type: 'motor', ipAddress: '100.68.27.133', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C5.2' },
  { tag: 'Z2J15M1', description: 'MOTOR DO VENTILADOR DAS REGUEIRAS Z2J13 E Z2J14', type: 'motor', ipAddress: '100.68.27.134', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C5.3' },
  { tag: 'Z2J17M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J19', type: 'motor', ipAddress: '100.68.27.138', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.3' },
  { tag: 'Z2J18M1', description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS', type: 'motor', ipAddress: '100.68.27.139', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.4' },
  { tag: 'Z2J18M2', description: 'ACIONAMENTO AUXILIAR DO ELEVADOR DE CANECAS', type: 'motor', ipAddress: '100.68.27.141', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.6' },
  { tag: 'Z2J32M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2J31', type: 'motor', ipAddress: '100.68.27.150', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C7.7' },
  { tag: 'Z2J33M1', description: 'MOTOR DA VÁLVULA ROTATIVA Z2J33', type: 'motor', ipAddress: '100.68.27.147', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C7.4' },
  { tag: 'Z2J34M1', description: 'MOTOR DA ROSCA TRANSPORTADORA Z2J34', type: 'motor', ipAddress: '100.68.27.149', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C7.6' },
  { tag: 'Z2K02M1', description: 'BOMBA DE INJEÇÃO DE ÁGUA NO MOINHO', type: 'motor', ipAddress: '100.68.27.182', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C14.1' },
  { tag: 'Z2K03M1', description: 'BOMBA DE INJEÇÃO DE ÁGUA NO MOINHO', type: 'motor', ipAddress: '100.68.27.183', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C14.2' },
  { tag: 'Z2K06M1', description: 'MOTOR DO VENTILADOR DA TORRE ALPINA', type: 'motor', ipAddress: '100.68.27.123', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C4.3' },
  { tag: 'Z2K07M1', description: 'MOTOR DA BOMBA 1 DA TORRE ALPINA', type: 'motor', ipAddress: '100.68.27.135', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C5.4' },
  { tag: 'Z2K08M1', description: 'MOTOR DA BOMBA 2 DA TORRE ALPINA', type: 'motor', ipAddress: '100.68.27.167', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C11.4' },
  { tag: 'Z2P12M1', description: 'MOTOR DO EXAUSTOR DO FILTRO Z2P11', type: 'motor', ipAddress: '100.68.27.177', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C13.1' },
  { tag: 'Z2P22M1', description: 'MOTOR DO EXAUSTOR DO FILTRO Z2P22', type: 'motor', ipAddress: '100.68.27.180', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C13.4' },
  { tag: 'Z2P42M1', description: 'MOTOR DO EXAUSTOR DO FILTRO Z2P41', type: 'motor', ipAddress: '100.68.27.165', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C11.2' },
  { tag: 'Z2P43M1', description: 'MOTOR DA VÁLVULA ROTATIVA Z2P43', type: 'motor', ipAddress: '100.68.27.163', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C10.11' },
  { tag: 'Z2P52', description: 'MOTOR VENTILADOR DO FILTRO DE MANGAS - Z2P52', type: 'motor', ipAddress: '100.68.27.30', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C10.1' },
  { tag: 'Z2U02M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U01', type: 'motor', ipAddress: '100.68.27.145', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.10' },
  { tag: 'Z2U04M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U03', type: 'motor', ipAddress: '100.68.27.144', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.9' },
  { tag: 'Z2U05M1', description: 'MOTOR DA VÁLVULA ROTATIVA Z2U05', type: 'motor', ipAddress: '100.68.27.143', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.8' },
  { tag: 'Z2U06M1', description: 'MOTOR DA VÁLVULA ROTATIVA Z2U06', type: 'motor', ipAddress: '100.68.27.142', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C6.7' },
  { tag: 'Z2U10M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U09', type: 'motor', ipAddress: '100.68.27.146', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C7.1' },
  { tag: 'Z2U11M1', description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS', type: 'motor', ipAddress: '100.68.27.161', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C10.9' },
  { tag: 'Z2U11M2', description: 'ACIONAMENTO AUXILIAR DO ELEVADOR DE CANECAS', type: 'motor', ipAddress: '100.68.27.162', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C10.10' },
  { tag: 'Z2U13M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U12', type: 'motor', ipAddress: '100.68.27.168', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C11.5' },
  { tag: 'Z2U14M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U12', type: 'motor', ipAddress: '100.68.27.169', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C11.6' },
  { tag: 'Z2U16M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U15', type: 'motor', ipAddress: '100.68.27.170', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C11.7' },
  { tag: 'Z2U17M1', description: 'MOTOR DO VENTILADOR DA REGUEIRA Z2U15', type: 'motor', ipAddress: '100.68.27.171', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C11.8' },
  { tag: 'Z2A01Q1', description: 'ALIMENTAÇÃO DO PAINEL DA BALANÇA DOSADORA DE CLINQUER', type: 'motor', ipAddress: '100.68.27.132', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C12.7' },
  { tag: 'Z2B01Q1', description: 'ALIMENTAÇÃO DO PAINEL DA BALANÇA DOSADORA DE GESSO', type: 'motor', ipAddress: '100.68.27.130', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C12.5' },
  { tag: 'Z2C01Q1', description: 'ALIMENTAÇÃO DO PAINEL DA BALANÇA DOSADORA DE CALCÁRIO', type: 'motor', ipAddress: '100.68.27.130', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C12.4' },
  { tag: 'P1P112M1', description: 'MOTOR DO EXAUSTOR DO FILTRO P1P111', type: 'motor', ipAddress: '100.68.31.197', ccm: 'SU7.1-CCM-P1-3', gaveta: '5G' },
  { tag: 'P1P113M1', description: 'MOTOR DA VÁLVULA ROTATIVA DO FILTRO P1P111', type: 'motor', ipAddress: '100.68.31.178', ccm: 'SU7.1-CCM-P1-3', gaveta: '3C' },
  { tag: 'P1U21M1', description: 'MOTOR PRINCIPAL DO ELEVADOR DE CANECAS', type: 'motor', ipAddress: '100.68.31.181', ccm: 'SU7.1-CCM-P1-3', gaveta: '3F' },
  { tag: 'P1U21M2', description: 'ACIONAMENTO AUXILIAR DO ELEVADOR DE CANECAS', type: 'motor', ipAddress: '100.68.31.192', ccm: 'SU7.1-CCM-P1-3', gaveta: '5A' },
  { tag: 'Z2M06M1', description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 1', type: 'motor', ipAddress: '100.68.27.105', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C2.5' },
  { tag: 'Z2M07M1', description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 2', type: 'motor', ipAddress: '100.68.27.106', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C2.6' },
  { tag: 'Z2M08M1', description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 1', type: 'motor', ipAddress: '100.68.27.102', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C2.2' },
  { tag: 'Z2M09M1', description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 2', type: 'motor', ipAddress: '100.68.27.103', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C2.3' },
  { tag: 'Z2M11M1', description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 1', type: 'motor', ipAddress: '100.68.27.114', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C3.5' },
  { tag: 'Z2M12M1', description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 2', type: 'motor', ipAddress: '100.68.27.115', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C3.6' },
  { tag: 'Z2M13M1', description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 1', type: 'motor', ipAddress: '100.68.27.111', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C3.2' },
  { tag: 'Z2M14M1', description: 'BOMBA DE LUBRIFICAÇÃO DE ALTA PRESSÃO 2', type: 'motor', ipAddress: '100.68.27.112', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C3.3' },
  { tag: 'Z2M15M1', description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 1', type: 'motor', ipAddress: '100.68.27.121', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C4.1' },
  { tag: 'Z2M15M2', description: 'BOMBA DE LUBRIFICAÇÃO DE BAIXA PRESSÃO 2', type: 'motor', ipAddress: '100.68.27.122', ccm: 'SU6.2-CCM-Z2-1', gaveta: 'C4.2' },
];

// ─── Converte mockData em FormRecord ─────────────────────────────────────────
function toFormRecord(item) {
  const now = new Date().toISOString();
  const mainTag = getMainTag(item.tag);
  const isInstrument = item.type === 'instrument';

  return {
    id: crypto.randomUUID(),
    formType: isInstrument ? 'instrument' : 'motor',
    tag: item.tag,
    description: item.description || '',
    manufacturer: item.manufacturer || '',
    model: item.model || '',
    serialNumber: '',
    date: '',
    ipAddress: item.ipAddress || '',
    ccm: item.ccm || '',
    gaveta: item.gaveta || '',
    range: item.range || '',
    power: item.power || '',
    current: item.current || '',
    rpm: item.rpm || '',
    voltage: item.voltage || '',
    insulationClass: '',
    protectionDegree: item.protectionDegree || '',
    motorConnection: item.motorConnection || '',
    serviceFactor: item.serviceFactor || '',
    frequency: item.frequency || '',
    powerFactor: item.powerFactor || '',
    hiPotVoltage: '',
    ambientTemp: '',
    location: item.location || '',
    instrumentType: item.instrumentType || '',
    supplyVoltage: item.supplyVoltage || '',
    inputSignal: item.inputSignal || '',
    outputSignal: item.outputSignal || '',
    opValue: item.opValue || '',
    linkedEquipment: isInstrument ? (mainTag !== item.tag ? mainTag : '') : '',
    photos: [],
    results: { checklist: {}, measurements: {} },
    status: 'draft',
    userId: USER_ID,
    userEmail: USER_EMAIL,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando seed do Supabase...\n');

  // Verifica quais tags já existem para não duplicar
  const { data: existingRows, error: fetchErr } = await supabase
    .from('forms')
    .select('tag');

  if (fetchErr) {
    console.error('❌ Erro ao verificar registros existentes:', fetchErr.message);
    process.exit(1);
  }

  const existingTags = new Set((existingRows || []).map(r => r.tag));
  const records = mockData.map(toFormRecord);
  const toInsert = records.filter(r => !existingTags.has(r.tag));

  console.log(`📦 ${records.length} registros no projeto`);
  console.log(`⏭️  ${existingTags.size} já existem no Supabase`);
  console.log(`➕ ${toInsert.length} serão inseridos\n`);

  if (toInsert.length === 0) {
    console.log('✅ Supabase já está atualizado! Nada a inserir.');
    return;
  }

  let ok = 0;
  let fail = 0;

  // Insere em lotes de 10 para evitar timeout
  const BATCH = 10;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from('forms').insert(batch);

    if (error) {
      console.error(`  ✗ Lote ${i / BATCH + 1}: ${error.message}`);
      fail += batch.length;
    } else {
      for (const r of batch) {
        console.log(`  ✓ ${r.tag} — ${r.description.substring(0, 50)}`);
      }
      ok += batch.length;
    }
  }

  console.log(`\n✅ Seed concluído: ${ok} inseridos, ${fail} erros`);
}

main().catch(console.error);

