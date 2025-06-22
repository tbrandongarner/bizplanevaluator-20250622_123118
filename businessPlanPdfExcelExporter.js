const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const Excel = require('exceljs');
const { v4: uuidv4 } = require('uuid');

const EXPORT_DIR = process.env.EXPORT_PATH || path.join(__dirname, '../public/exports');
const BASE_URL = (process.env.BASE_URL || '').replace(/\/+$/, '');

function sanitizeFilename(input) {
  return input.replace(/[^a-zA-Z0-9-_]/g, '') || '';
}

async function cleanupFile(filePath) {
  try {
    await fsPromises.unlink(filePath);
  } catch (_) {
    // ignore
  }
}

async function exportBusinessPlan(plan) {
  const timestamp = Date.now();
  const rawId = plan.id ? String(plan.id) : uuidv4();
  const safeId = sanitizeFilename(rawId) || uuidv4();
  const baseName = `${safeId}-${timestamp}`;
  const pdfName = `${baseName}.pdf`;
  const xlsxName = `${baseName}.xlsx`;
  const outDir = EXPORT_DIR;
  const pdfPath = path.join(outDir, pdfName);
  const xlsxPath = path.join(outDir, xlsxName);

  try {
    await fsPromises.mkdir(outDir, { recursive: true });

    // Generate PDF
    const pdfDoc = new PDFDocument({ margin: 50 });
    const pdfStream = fs.createWriteStream(pdfPath);
    pdfDoc.pipe(pdfStream);
    pdfDoc.info.Title = plan.title || 'Business Plan';
    if (plan.author) pdfDoc.info.Author = plan.author;
    pdfDoc.font('Helvetica-Bold').fontSize(24).text(plan.title || 'Business Plan', { align: 'center' });
    pdfDoc.moveDown(2);

    const sections = [
      { title: 'Executive Summary', content: plan.executiveSummary },
      { title: 'Market Analysis', content: plan.marketAnalysis },
      { title: 'Target Audience', content: plan.targetAudience },
      { title: 'Pricing Strategy', content: plan.pricingStrategy },
      { title: 'Operations Plan', content: plan.operationsPlan },
      { title: 'Financial Projections', content: plan.financialProjections },
      { title: 'Conclusion', content: plan.conclusion }
    ];

    sections.forEach((sec, idx) => {
      if (!sec.content) return;
      if (idx > 0) pdfDoc.addPage();
      pdfDoc.font('Helvetica-Bold').fontSize(18).text(sec.title);
      pdfDoc.moveDown();
      pdfDoc.font('Helvetica').fontSize(12).text(sec.content, { align: 'left' });
      pdfDoc.moveDown(1);
    });

    pdfDoc.end();
    await new Promise((resolve, reject) => {
      pdfStream.on('finish', resolve);
      pdfStream.on('error', reject);
    });

    // Generate Excel
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('Business Plan');
    sheet.columns = [
      { header: 'Section', key: 'section', width: 30 },
      { header: 'Content', key: 'content', width: 100 }
    ];
    sections.forEach(sec => {
      if (sec.content) sheet.addRow({ section: sec.title, content: sec.content });
    });
    sheet.getColumn('content').alignment = { wrapText: true };

    await workbook.xlsx.writeFile(xlsxPath);

    const encodedPdfName = encodeURIComponent(pdfName);
    const encodedXlsxName = encodeURIComponent(xlsxName);
    const pdfUrl = `${BASE_URL}/exports/${encodedPdfName}`;
    const excelUrl = `${BASE_URL}/exports/${encodedXlsxName}`;

    return { pdfUrl, excelUrl };
  } catch (error) {
    await cleanupFile(pdfPath);
    await cleanupFile(xlsxPath);
    throw error;
  }
}

module.exports = { exportBusinessPlan };