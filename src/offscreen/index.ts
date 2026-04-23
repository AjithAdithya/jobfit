import * as pdfjs from 'pdfjs-dist';

// Point to the local worker file from the node_modules or CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

console.log('Offscreen script loaded for PDF Parsing');

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'PARSE_PDF') {
    console.log('Offscreen: Received PARSE_PDF message');
    
    parsePdf(message.data)
      .then((text) => {
        console.log('Offscreen: Parsing successful, sending response');
        sendResponse({ success: true, text });
      })
      .catch((error) => {
        console.error('Offscreen: Parsing failed:', error);
        sendResponse({ success: false, error: String(error) });
      });
    return true; // Keep channel open for async response
  }
});

async function parsePdf(data: Uint8Array): Promise<string> {
  console.log('Offscreen: Initializing pdfjs with data length:', data?.length);
  
  // Correctness fix: pdfjs.getDocument expects an object with a 'data' key if passing a Uint8Array
  const loadingTask = pdfjs.getDocument({ data });
  
  const pdf = await loadingTask.promise;
  console.log('Offscreen: PDF document loaded, pages:', pdf.numPages);
  
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    console.log(`Offscreen: Processing page ${i}/${pdf.numPages}`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}
