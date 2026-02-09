import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generatePDF(
  elementId: string,
  filename: string,
  title: string = 'SwipeLP Analytics Report'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Create a temporary container with white background
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.backgroundColor = '#ffffff';
  clone.style.padding = '20px';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Add title
    pdf.setFontSize(16);
    pdf.text(title, margin, 15);

    // Add date
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString('ja-JP')}`, margin, 22);

    // Calculate image dimensions to fit on page
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Check if content fits on one page
    const maxImgHeight = pageHeight - 30 - margin; // 30mm for header

    if (imgHeight > maxImgHeight) {
      // Multi-page handling
      let remainingHeight = imgHeight;
      let yOffset = 0;

      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, maxImgHeight);
        const startY = yOffset === 0 ? 30 : margin;

        pdf.addImage(
          imgData,
          'PNG',
          margin,
          startY,
          imgWidth,
          imgHeight,
          undefined,
          'FAST',
          0
        );

        remainingHeight -= sliceHeight;
        yOffset += sliceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }
    } else {
      // Single page
      pdf.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(clone);
  }
}

export async function captureElementAsImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}
