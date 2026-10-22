/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

function formatTeeth(notation: any) {
  if (!notation) return '-';
  try {
    const parsed = typeof notation === 'string' ? JSON.parse(notation) : notation;
    const parts = [];
    if (parsed.q1 && parsed.q1.length) parts.push(`Q1: ${parsed.q1.join(',')}`);
    if (parsed.q2 && parsed.q2.length) parts.push(`Q2: ${parsed.q2.join(',')}`);
    if (parsed.q3 && parsed.q3.length) parts.push(`Q3: ${parsed.q3.join(',')}`);
    if (parsed.q4 && parsed.q4.length) parts.push(`Q4: ${parsed.q4.join(',')}`);
    return parts.join(' | ') || '-';
  } catch {
    return '-';
  }
}

const drawLine = (doc: PDFKit.PDFDocument, y: number, color = '#E5E7EB') => {
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(color).stroke();
};

const ensureSpace = (doc: PDFKit.PDFDocument, spaceNeeded: number) => {
  if (doc.y + spaceNeeded > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    return true;
  }
  return false;
};

const drawHeader = (doc: PDFKit.PDFDocument) => {
  const bannerPath = path.join(process.cwd(), 'public', 'assets', 'v-dental-care-bill-banner.png');
  const bannerWidth = CONTENT_WIDTH;
  const bannerHeight = Math.round(bannerWidth * (341 / 1024)); // ≈ 165pt
  const bannerX = MARGIN;
  const bannerY = 20;
  
  if (fs.existsSync(bannerPath)) {
    try {
      const bannerBuffer = fs.readFileSync(bannerPath);
      doc.image(bannerBuffer, bannerX, bannerY, { width: bannerWidth, height: bannerHeight });
      doc.y = bannerY + bannerHeight + 4;
    } catch {
      doc.y = bannerY + 10;
    }
  } else {
    doc.y = bannerY + 10;
  }
  
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('FINAL BILL', { align: 'center', characterSpacing: 1 });
  doc.moveDown(0.3);
  
  drawLine(doc, doc.y, '#374151');
  doc.moveDown(0.8);
};

const drawPatientInfo = (doc: PDFKit.PDFDocument, op: any) => {
  ensureSpace(doc, 100);
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('PATIENT INFORMATION');
  doc.moveDown(0.5);
  
  const startY = doc.y;
  
  // Background box
  doc.fillColor('#F9FAFB').rect(MARGIN, startY, CONTENT_WIDTH, 60).fill();
  doc.rect(MARGIN, startY, CONTENT_WIDTH, 60).strokeColor('#E5E7EB').stroke();
  
  // Text inside box
  doc.fillColor('#6B7280').font('Helvetica-Bold').fontSize(8);
  
  // Row 1
  doc.text('OP NUMBER', MARGIN + 15, startY + 12);
  doc.text('PATIENT NAME', MARGIN + 220, startY + 12);
  
  doc.font('Helvetica').fillColor('#111827').fontSize(10);
  doc.text(op.opNumber || '-', MARGIN + 15, startY + 24);
  doc.text(op.patientName || '-', MARGIN + 220, startY + 24);
  
  // Row 2
  doc.fillColor('#6B7280').font('Helvetica-Bold').fontSize(8);
  doc.text('AGE / SEX', MARGIN + 15, startY + 40);
  doc.text('REGISTRATION DATE', MARGIN + 220, startY + 40);
  
  doc.font('Helvetica').fillColor('#111827').fontSize(10);
  doc.text(`${op.age} / ${op.sex}`, MARGIN + 15, startY + 52);
  doc.text(new Date(op.date).toLocaleDateString(), MARGIN + 220, startY + 52);
  
  doc.y = startY + 80;
};

const drawTreatmentTable = (doc: PDFKit.PDFDocument, op: any) => {
  ensureSpace(doc, 80);
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('TREATMENT DETAILS');
  doc.moveDown(0.5);
  
  const colSno = MARGIN + 10;
  const colTreatment = MARGIN + 40;
  const colDetails = MARGIN + 180;
  const colAmount = MARGIN + 390;
  const amountWidth = CONTENT_WIDTH - (colAmount - MARGIN) - 10;
  
  const headerY = doc.y;
  doc.fillColor('#F3F4F6').rect(MARGIN, headerY, CONTENT_WIDTH, 20).fill();
  doc.rect(MARGIN, headerY, CONTENT_WIDTH, 20).strokeColor('#E5E7EB').stroke();
  
  doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(9);
  doc.text('S.No', colSno, headerY + 6);
  doc.text('Treatment', colTreatment, headerY + 6);
  doc.text('Details', colDetails, headerY + 6);
  doc.text('Amount', colAmount, headerY + 6, { width: amountWidth, align: 'right' });
  
  doc.y = headerY + 20;
  
  let totalTreatmentCost = 0;
  const treatments = op.finalizedTreatments || [];
  
  doc.font('Helvetica').fontSize(9).fillColor('#111827');
  
  if (treatments.length === 0) {
    const rowY = doc.y;
    doc.text('No treatments found.', colSno, rowY + 10);
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, 30).strokeColor('#E5E7EB').stroke();
    doc.y = rowY + 30;
  } else {
    treatments.forEach((ft: any, index: number) => {
      let detailsText = '';
      let amount = 0;
      
      const isCrown = ft.treatmentNameSnapshot === 'Crowns';
      if (isCrown) {
        const qty = ft.numberOfCrowns || 1;
        const unitPrice = ft.patientPriceSnapshot || 0;
        amount = qty * unitPrice;
        const crownName = ft.crownType?.name || 'Unknown';
        detailsText = `Type: ${crownName}\nQty: ${qty} x ${formatCurrency(unitPrice)}`;
      } else {
        amount = ft.patientPriceSnapshot || 0;
        detailsText = ft.teethNotation ? `Teeth: ${formatTeeth(ft.teethNotation)}` : '-';
      }
      
      totalTreatmentCost += amount;
      
      const detailsHeight = doc.heightOfString(detailsText, { width: 200 });
      const rowHeight = Math.max(25, detailsHeight + 12);
      
      ensureSpace(doc, rowHeight);
      
      const rowY = doc.y;
      doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight).strokeColor('#E5E7EB').stroke();
      
      doc.text(`${index + 1}`, colSno, rowY + 8);
      doc.text(ft.treatmentNameSnapshot, colTreatment, rowY + 8, { width: 130 });
      doc.text(detailsText, colDetails, rowY + 8, { width: 200 });
      doc.text(formatCurrency(amount), colAmount, rowY + 8, { width: amountWidth, align: 'right' });
      
      doc.y = rowY + rowHeight;
    });
  }
  
  const totalY = doc.y;
  doc.fillColor('#F9FAFB').rect(MARGIN, totalY, CONTENT_WIDTH, 25).fill();
  doc.rect(MARGIN, totalY, CONTENT_WIDTH, 25).strokeColor('#E5E7EB').stroke();
  
  doc.fillColor('#111827').font('Helvetica-Bold');
  doc.text('TOTAL TREATMENT COST', colDetails, totalY + 8);
  doc.text(formatCurrency(totalTreatmentCost), colAmount, totalY + 8, { width: amountWidth, align: 'right' });
  
  doc.y = totalY + 45;
  return totalTreatmentCost;
};

const drawPaymentHistory = (doc: PDFKit.PDFDocument, ledgers: any[]) => {
  ensureSpace(doc, 80);
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('PAYMENT HISTORY');
  doc.moveDown(0.5);
  
  const colTx = MARGIN + 10;
  const colPaid = MARGIN + 220;
  const colBalance = MARGIN + 360;
  const rightWidth = CONTENT_WIDTH - (colBalance - MARGIN) - 10;
  const midWidth = colBalance - colPaid - 20;
  
  const headerY = doc.y;
  doc.fillColor('#F3F4F6').rect(MARGIN, headerY, CONTENT_WIDTH, 20).fill();
  doc.rect(MARGIN, headerY, CONTENT_WIDTH, 20).strokeColor('#E5E7EB').stroke();
  
  doc.fillColor('#4B5563').font('Helvetica-Bold').fontSize(9);
  doc.text('Transaction / Date', colTx, headerY + 6);
  doc.text('Paid Amount', colPaid, headerY + 6, { width: midWidth, align: 'right' });
  doc.text('Balance After Tx', colBalance, headerY + 6, { width: rightWidth, align: 'right' });
  
  doc.y = headerY + 20;
  doc.font('Helvetica').fontSize(9).fillColor('#111827');
  
  if (!ledgers || ledgers.length === 0) {
    const rowY = doc.y;
    doc.text('No payment history found.', colTx, rowY + 10);
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, 30).strokeColor('#E5E7EB').stroke();
    doc.y = rowY + 30;
    doc.moveDown(1.5);
    return;
  }
  
  ledgers.forEach((ledger: any) => {
    let txText = `${new Date(ledger.date).toLocaleDateString()}`;
    if (ledger.paymentMode) txText += `\nMode: ${ledger.paymentMode}`;
    if (ledger.discount > 0) txText += `\n(Discount: ${formatCurrency(ledger.discount)})`;
    
    const height = doc.heightOfString(txText, { width: 200 });
    const rowHeight = Math.max(25, height + 12);
    
    ensureSpace(doc, rowHeight);
    
    const rowY = doc.y;
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight).strokeColor('#E5E7EB').stroke();
    
    doc.text(txText, colTx, rowY + 8);
    
    if (ledger.paidAmount > 0) {
      doc.text(formatCurrency(ledger.paidAmount), colPaid, rowY + 8, { width: midWidth, align: 'right' });
    } else {
      doc.text('-', colPaid, rowY + 8, { width: midWidth, align: 'right' });
    }
    
    doc.text(formatCurrency(ledger.balance), colBalance, rowY + 8, { width: rightWidth, align: 'right' });
    
    doc.y = rowY + rowHeight;
  });
  
  doc.moveDown(1.5);
};

const drawFinancialSummaryAndStatus = (doc: PDFKit.PDFDocument, op: any, ledgers: any[], totalTreatmentCost: number) => {
  ensureSpace(doc, 150);
  
  let totalPaid = 0;
  let totalDiscount = op.advisoryDiscount || 0;
  
  if (ledgers && ledgers.length > 0) {
    ledgers.forEach((l: any) => {
      totalPaid += (l.paidAmount || 0);
      totalDiscount += (l.discount || 0);
    });
  }
  
  const netPayable = totalTreatmentCost - totalDiscount;
  let outstanding = netPayable - totalPaid;
  if (ledgers && ledgers.length > 0) {
    outstanding = ledgers[ledgers.length - 1].balance; // Ensure truth from ledger
  }
  
  const startY = doc.y;
  
  // Left side: Payment Status
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('PAYMENT STATUS', MARGIN, startY);
  const statusY = startY + 20;
  
  if (outstanding <= 0) {
    doc.fillColor('#DEF7EC').rect(MARGIN, statusY, 150, 25).fill();
    doc.fillColor('#03543F').font('Helvetica-Bold').fontSize(10).text('PAID IN FULL', MARGIN, statusY + 7, { width: 150, align: 'center' });
  } else {
    doc.fillColor('#FDF2F8').rect(MARGIN, statusY, 200, 25).fill();
    doc.fillColor('#9F1239').font('Helvetica-Bold').fontSize(10).text(`OUTSTANDING: ${formatCurrency(outstanding)}`, MARGIN, statusY + 7, { width: 200, align: 'center' });
  }
  
  // Right side: Financial Summary Box
  const boxX = PAGE_WIDTH / 2; 
  const boxWidth = CONTENT_WIDTH / 2;
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('FINANCIAL SUMMARY', boxX, startY);
  const sumY = startY + 20;
  
  doc.fillColor('#F9FAFB').rect(boxX, sumY, boxWidth, 110).fill();
  doc.rect(boxX, sumY, boxWidth, 110).strokeColor('#E5E7EB').stroke();
  
  doc.fillColor('#4B5563').font('Helvetica').fontSize(9);
  
  const valX = boxX + boxWidth - 110;
  const labelX = boxX + 15;
  
  doc.text('Gross Treatment Cost', labelX, sumY + 15);
  doc.text(formatCurrency(totalTreatmentCost), valX, sumY + 15, { width: 95, align: 'right' });
  
  doc.text('Total Discount', labelX, sumY + 30);
  doc.text(formatCurrency(totalDiscount), valX, sumY + 30, { width: 95, align: 'right' });
  
  doc.moveTo(boxX + 10, sumY + 45).lineTo(boxX + boxWidth - 10, sumY + 45).strokeColor('#D1D5DB').stroke();
  
  doc.font('Helvetica-Bold').fillColor('#111827');
  doc.text('Net Payable', labelX, sumY + 55);
  doc.text(formatCurrency(netPayable), valX, sumY + 55, { width: 95, align: 'right' });
  
  doc.text('Total Paid', labelX, sumY + 70);
  doc.text(formatCurrency(totalPaid), valX, sumY + 70, { width: 95, align: 'right' });
  
  doc.moveTo(boxX + 10, sumY + 85).lineTo(boxX + boxWidth - 10, sumY + 85).strokeColor('#D1D5DB').stroke();
  
  doc.fontSize(10);
  doc.text('Outstanding Balance', labelX, sumY + 95);
  doc.text(formatCurrency(outstanding), valX, sumY + 95, { width: 95, align: 'right' });
  
  doc.y = Math.max(statusY + 40, sumY + 130);
};

const drawFooter = (doc: PDFKit.PDFDocument) => {
  ensureSpace(doc, 80);
  
  doc.moveDown(2);
  drawLine(doc, doc.y);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#111827').font('Helvetica').text('Authorized Signature', { align: 'right' });
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#6B7280').text('V Dental Care — Laser | Implants | Cosmetics', { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.text('This is a computer-generated invoice.', { align: 'center' });
};

/**
 * Generates a Final Bill PDF from raw Prisma OPRecord (with included
 * finalizedTreatments) and PatientLedger rows.
 *
 * This service is purely read-only — it does NOT mutate any database records.
 */
export const finalBillService = {
  generatePdf: async (op: any, ledgers: any[]): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        drawHeader(doc);
        drawPatientInfo(doc, op);
        const totalTreatmentCost = drawTreatmentTable(doc, op);
        drawPaymentHistory(doc, ledgers);
        drawFinancialSummaryAndStatus(doc, op, ledgers, totalTreatmentCost);
        drawFooter(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
};
