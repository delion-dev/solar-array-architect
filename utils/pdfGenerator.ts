
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Preloads all images within the given element to ensure they are ready for capture.
 */
const waitForImages = (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const handleLoad = () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleLoad);
        resolve();
      };
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleLoad);
    });
  });
  return Promise.all(promises).then(() => {});
};

/**
 * Captures a DOM element as a canvas.
 */
const captureElement = async (elementId: string, scale: number = 2): Promise<HTMLCanvasElement | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return null;
  }

  // Ensure images are loaded before capturing
  await waitForImages(element);

  return await html2canvas(element, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff', // Ensure white background
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });
};

/**
 * Generates a base64 image string for preview purposes.
 * @param elementId The ID of the HTML element to render.
 */
export const generatePreviewImage = async (elementId: string): Promise<string | null> => {
  // Use a slightly lower scale for preview to keep it fast
  const canvas = await captureElement(elementId, 1.5);
  return canvas ? canvas.toDataURL('image/png') : null;
};

/**
 * Generates a PDF from a specific DOM element.
 * @param elementId The ID of the HTML element to render.
 * @param fileName The name of the file to save.
 */
export const generatePDF = async (elementId: string, fileName: string): Promise<boolean> => {
  try {
    // 1. Capture the element as a canvas (High resolution for print)
    const canvas = await captureElement(elementId, 2);
    if (!canvas) return false;

    // 2. Calculate PDF dimensions (A4 reference)
    const imgData = canvas.toDataURL('image/png');
    // jsPDF instantiation (Portrait, mm, A4)
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // 3. Add image to PDF (handle multi-page if content is too long)
    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Loop for subsequent pages
    // Fix: Use a small buffer (e.g., 2mm) instead of > 0 to prevent blank pages 
    // caused by sub-pixel rounding errors or CSS/PDF unit mismatches.
    while (heightLeft > 2) { 
      position = heightLeft - imgHeight; 
      
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      
      heightLeft -= pdfHeight;
    }

    // 4. Save
    const finalName = fileName.trim() ? (fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`) : 'Solar_Report.pdf';
    pdf.save(finalName);
    return true;

  } catch (error) {
    console.error('PDF Generation failed', error);
    return false;
  }
};
