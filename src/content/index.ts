import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

console.log('JobFit AI Content Script loaded');

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'EXTRACT_JD') {
    try {
      // Clone the document to avoid modifying the original page
      const documentClone = document.cloneNode(true) as Document;
      const reader = new Readability(documentClone);
      const article = reader.parse();

      if (article) {
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(article.content);
        
        // Try to get a more accurate job title from an h1 element, 
        // fallback to Readability title (which usually uses document.title)
        const h1 = documentClone.querySelector('h1')?.textContent?.trim();
        const finalTitle = h1 || article.title;

        sendResponse({ 
          success: true, 
          data: {
            title: finalTitle,
            content: markdown,
            textContent: article.textContent,
            url: window.location.href,
            siteName: article.siteName
          }
        });
      } else {
        sendResponse({ success: false, error: 'Could not parse page content' });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  }
  return true;
});
