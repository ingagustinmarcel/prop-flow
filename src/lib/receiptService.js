import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './utils';

export const generateReceipt = (payment, unit) => {
    const doc = new jsPDF();
    const primaryColor = '#059669'; // Emerald-600
    const secondaryColor = '#475569'; // Slate-600

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor('#ffffff');
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('RENT RECEIPT', 105, 25, { align: 'center' });

    // Body Setup
    doc.setTextColor(secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const startY = 60;
    const margin = 20;

    // Receipt Reference
    doc.text(`Receipt ID: ${payment.id.slice(0, 8).toUpperCase()}`, margin, startY);
    doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 190, startY, { align: 'right' });

    // Divider
    doc.setDrawColor('#e2e8f0');
    doc.line(margin, startY + 5, 190, startY + 5);

    // Content
    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text('Property Details', margin, startY + 20);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text(`Property: ${unit.name}`, margin, startY + 30);
    doc.text(`Tenant: ${unit.tenant || 'N/A'}`, margin, startY + 38);

    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text('Payment Information', margin, startY + 55);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor);
    doc.text(`Period: ${payment.forMonth}`, margin, startY + 65);
    doc.text(`Amount Paid: ${formatCurrency(payment.amount)}`, margin, startY + 73);
    doc.text(`Date Paid: ${formatDate(payment.datePaid)}`, margin, startY + 81);

    // Summary Box
    doc.setFillColor('#f8fafc');
    doc.rect(margin, startY + 95, 170, 30, 'F');
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(margin, startY + 95, 170, 30, 'S');

    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID IN FULL', margin + 85, startY + 115, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor('#94a3b8');
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your payment and for choosing PropFlow.', 105, 280, { align: 'center' });

    // Save
    doc.save(`Receipt_${unit.name}_${payment.forMonth}.pdf`);
};
