import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './utils';

export const generateReceipt = (payment, unit, labels = {}) => {
    const l = {
        title: labels.title || 'RENT RECEIPT',
        receiptId: labels.receiptId || 'Receipt ID',
        dateIssued: labels.dateIssued || 'Date Issued',
        propertyDetails: labels.propertyDetails || 'Property Details',
        property: labels.property || 'Property',
        tenant: labels.tenant || 'Tenant',
        paymentInfo: labels.paymentInfo || 'Payment Information',
        period: labels.period || 'Period',
        amountPaid: labels.amountPaid || 'Amount Paid',
        datePaid: labels.datePaid || 'Date Paid',
        paidInFull: labels.paidInFull || 'PAID IN FULL',
        footer: labels.footer || 'Thank you for your payment and for choosing PropFlow.',
        na: labels.na || 'N/A',
    };

    const doc = new jsPDF();
    const primaryColor = '#059669'; // Emerald-600
    const secondaryColor = '#475569'; // Slate-600

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor('#ffffff');
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(l.title, 105, 25, { align: 'center' });

    // Body Setup
    doc.setTextColor(secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const startY = 60;
    const margin = 20;

    // Receipt Reference
    doc.text(`${l.receiptId}: ${payment.id.slice(0, 8).toUpperCase()}`, margin, startY);
    doc.text(`${l.dateIssued}: ${new Date().toLocaleDateString()}`, 190, startY, { align: 'right' });

    // Divider
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, startY + 5, 190, startY + 5);

    // Content
    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text(l.propertyDetails, margin, startY + 20);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text(`${l.property}: ${unit.name}`, margin, startY + 30);
    doc.text(`${l.tenant}: ${unit.tenant || l.na}`, margin, startY + 38);

    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text(l.paymentInfo, margin, startY + 55);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text(`${l.period}: ${payment.forMonth}`, margin, startY + 65);
    doc.text(`${l.amountPaid}: ${formatCurrency(payment.amount)}`, margin, startY + 73);
    doc.text(`${l.datePaid}: ${formatDate(payment.datePaid)}`, margin, startY + 81);

    // Summary Box
    doc.setFillColor('#f8fafc');
    doc.rect(margin, startY + 95, 170, 30, 'F');
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, startY + 95, 170, 30, 'S');

    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(l.paidInFull, margin + 85, startY + 115, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor('#94a3b8');
    doc.setFont('helvetica', 'italic');
    doc.text(l.footer, 105, 280, { align: 'center' });

    // Save
    doc.save(`Receipt_${unit.name}_${payment.forMonth}.pdf`);
};
