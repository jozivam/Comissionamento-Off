/**
 * Script: extract-pdf-index.mjs
 * Extrai texto do PDF por página usando pdf-parse v2.
 * Gera src/data/pdfExtracted.json com dados de mapa de tags.
 *
 * Uso: node scripts/extract-pdf-index.mjs
 */

import { readFileSync, readFile as readFilePromise, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { readFile } from 'fs/promises';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH = resolve(__dirname, '../src/arquivos/ED-E-Z2000-409-02.pdf');
const OUTPUT_PATH = resolve(__dirname, '../src/data/pdfExtracted.json');

// ─── Extrai dados técnicos de um trecho de texto ──────────────────────────────
function extractTechnicalData(text) {
  const data = {};

  const ipMatch = text.match(/ENDERE[ÇC]O\s+IP[:\s]+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/i);
  if (ipMatch) data.ip = ipMatch[1];

  const ccmMatch = text.match(/CCM[:\s]+([\w\.\-\/]+)/i);
  if (ccmMatch) data.ccm = ccmMatch[1].trim();

  const gavetaMatch = text.match(/GAVETA[:\s]+([\w\.\-\/]+)/i);
  if (gavetaMatch) data.gaveta = gavetaMatch[1].trim();

  const salaMatch = text.match(/SALA\s+EL[EÉ]TRICA[:\s]+([^\n\r]+)/i);
  if (salaMatch) data.salaEletrica = salaMatch[1].trim().substring(0, 80);

  const potenciaMatch = text.match(/POT[EÊ]NCIA[:\s]+([\d\.,]+\s*kW)/i);
  if (potenciaMatch) data.potencia = potenciaMatch[1].trim();

  const correnteMatch = text.match(/CORRENTE[:\s]+([\d\.,]+\s*A)/i);
  if (correnteMatch) data.corrente = correnteMatch[1].trim();

  return data;
}

// ─── Analisa linhas de índice das páginas 2-3 ────────────────────────────────
function parseIndexEntries(text) {
  const entries = [];
  const lines = text.split(/\n/).filter(l => l.trim().length > 5);

  for (const line of lines) {
    const trimmed = line.trim();

    // Padrão 1: "065  Z2J01M1  MOTOR DA CORREIA TRANSPORTADORA"
    const m1 = trimmed.match(/^(\d{1,3})\s+([A-Z][A-Z0-9]{3,16})\s+(.{10,70})/);
    if (m1) {
      const desc = m1[3].replace(/\.{3,}.+$/, '').trim();
      if (desc.length > 5) {
        entries.push({ page: parseInt(m1[1]), tag: m1[2], description: desc });
        continue;
      }
    }

    // Padrão 2: "Z2J01M1  MOTOR DA CORREIA ............. 065"
    const m2 = trimmed.match(/^([A-Z][A-Z0-9]{3,16})\s+(.{10,60}?)\s*\.{3,}\s*(\d{1,3})\s*$/);
    if (m2) {
      entries.push({ page: parseInt(m2[3]), tag: m2[1], description: m2[2].trim() });
    }
  }

  // Deduplica
  const seen = new Set();
  return entries.filter(e => {
    const key = `${e.tag}-${e.page}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return e.page > 0 && e.page < 400;
  });
}

async function main() {
  console.log('📄 Carregando PDF:', PDF_PATH);
  const buffer = await readFile(PDF_PATH);

  const output = {
    totalPages: 0,
    extractedAt: new Date().toISOString(),
    index: [],
    pageData: {}
  };

  // ─── 1. Informações gerais (total de páginas) ────────────────────────────
  {
    const infoParser = new PDFParse({ data: buffer });
    const info = await infoParser.getInfo({ parsePageInfo: true });
    await infoParser.destroy();
    output.totalPages = info.total || 0;
    console.log(`✅ Total de páginas: ${output.totalPages}`);
  }

  // ─── 2. Extrai texto página por página (páginas do índice: 2 e 3) ────────
  console.log('📑 Extraindo índice das páginas 2 e 3...');
  for (const pageNum of [2, 3]) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText({ partial: [pageNum] });
    await parser.destroy();
    
    const text = result.text || '';
    const entries = parseIndexEntries(text);
    output.index.push(...entries);
    console.log(`  Página ${pageNum}: +${entries.length} entradas (total: ${output.index.length})`);
    
    // Debug: mostra amostra do texto extraído
    if (text.length > 0) {
      console.log(`  Amostra texto p.${pageNum}: "${text.substring(0, 120).replace(/\n/g, ' ')}..."`);
    } else {
      console.log(`  ⚠️  Nenhum texto extraído da página ${pageNum}`);
    }
  }

  // ─── 3. Dados técnicos das páginas-chave ────────────────────────────────
  const knownPages = [
    8, 11, 12, 14, 15, 37, 38, 44, 45, 51, 52, 58, 59, 65, 70, 73, 74,
    76, 79, 80, 81, 88, 89, 91, 92, 93, 99, 100, 102, 104, 107, 108, 109,
    111, 112, 121, 125, 129, 140, 147, 160, 173, 178, 181, 182, 185, 188,
    191, 194, 210, 212, 215, 219, 222, 223, 225, 254, 257, 259, 264, 267,
    270, 273, 281, 283, 286, 288, 293, 297, 304, 305, 313, 316, 348
  ];

  console.log(`\n🔍 Extraindo dados técnicos de ${knownPages.length} páginas-chave...`);
  let found = 0;

  for (let i = 0; i < knownPages.length; i += 5) {
    const batch = knownPages.slice(i, i + 5);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText({ partial: batch });
    await parser.destroy();
    
    // getText com partial retorna texto concatenado — separamos por página manualmente
    // Como não temos separação por página aqui, usamos os padrões de extração no texto total
    const text = result.text || '';
    for (const pNum of batch) {
      const techData = extractTechnicalData(text);
      if (Object.keys(techData).length > 0 && !output.pageData[pNum]) {
        output.pageData[pNum] = { page: pNum, ...techData };
        found++;
      }
    }
    
    process.stdout.write(`\r  Processados: ${Math.min(i + 5, knownPages.length)}/${knownPages.length}`);
  }

  console.log(`\n  Páginas com dados técnicos: ${Object.keys(output.pageData).length}`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Arquivo salvo em: ${OUTPUT_PATH}`);
  console.log(`   Índice: ${output.index.length} entradas`);
  console.log(`   Dados técnicos: ${Object.keys(output.pageData).length} páginas`);
  console.log(`   Total de páginas: ${output.totalPages}`);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
