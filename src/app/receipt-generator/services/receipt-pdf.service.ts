import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Injectable({ providedIn: 'root' })
export class ReceiptPdfService {
  async elementToPdfBlob(element: HTMLElement): Promise<Blob> {
    // Capture the visible .a4 sheet exactly as painted (including CSS scale).
    const width = element.offsetWidth || 794;
    const height = element.offsetHeight || 1123;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    return pdf.output('blob');
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
