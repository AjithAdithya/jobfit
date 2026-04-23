import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

console.log('JobFit AI Content Script loaded');

const JOB_BOARD_DOMAINS = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com',
  'simplyhired.com', 'careerbuilder.com', 'dice.com', 'greenhouse.io', 'lever.co',
  'workday.com', 'myworkdayjobs.com', 'workable.com', 'smartrecruiters.com',
  'recruitee.com', 'jobvite.com', 'taleo.net', 'icims.com', 'brassring.com',
  'ashbyhq.com', 'rippling.com', 'bamboohr.com', 'pinpointapp.com',
];

function isJobBoard(hostname: string): boolean {
  return JOB_BOARD_DOMAINS.some(d => hostname.includes(d));
}

function extractCompanyName(doc: Document, url: string): string {
  // 1. JSON-LD structured data — most reliable for job sites
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of Array.from(ldScripts)) {
    try {
      const raw = JSON.parse(script.textContent || '');
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        // Direct hiringOrganization
        const org = item.hiringOrganization || item.recruiter;
        if (org?.name && typeof org.name === 'string' && org.name.trim()) {
          return org.name.trim();
        }
        // @graph array (common in Workday, etc.)
        if (Array.isArray(item['@graph'])) {
          for (const node of item['@graph']) {
            const nodeOrg = node.hiringOrganization;
            if (nodeOrg?.name) return nodeOrg.name.trim();
          }
        }
      }
    } catch {}
  }

  // 2. Microdata
  const hiringOrgEl = doc.querySelector('[itemprop="hiringOrganization"]');
  if (hiringOrgEl) {
    const nameEl = hiringOrgEl.querySelector('[itemprop="name"]');
    if (nameEl?.textContent?.trim()) return nameEl.textContent.trim();
    const ownText = (hiringOrgEl as HTMLElement).innerText?.trim();
    if (ownText && ownText.length < 100) return ownText;
  }

  // 3. Site-specific selectors (ordered by reliability)
  const siteSelectors = [
    // LinkedIn
    '.jobs-unified-top-card__company-name a',
    '.jobs-unified-top-card__company-name',
    '.topcard__org-name-link',
    // Indeed
    '[data-testid="inlineHeader-companyName"] a',
    '[data-testid="inlineHeader-companyName"]',
    '[data-testid="jobsearch-CompanyInfoContainer"] a',
    // Glassdoor
    '[data-test="employer-name"]',
    '.employer-info__name',
    // Greenhouse
    '#header .company-name',
    '.company-name',
    // Lever
    '.main-header-employer',
    '.posting-header .company-name',
    // Workable
    '[data-ui="job-company"]',
    '.company__name',
    // SmartRecruiters
    '.job-ad__company-name',
    // Generic ATS patterns
    '[class*="company-name"]:not([class*="icon"])',
    '[class*="employer-name"]',
    '[class*="hiring-company"]',
    '[data-company-name]',
    '[data-employer]',
  ];
  for (const sel of siteSelectors) {
    try {
      const el = doc.querySelector(sel) as HTMLElement | null;
      const text = el?.getAttribute('data-company-name')
        || el?.getAttribute('data-employer')
        || el?.textContent?.trim();
      if (text && text.length > 1 && text.length < 120) return text;
    } catch {}
  }

  // 4. OG meta tag — only if not a job board
  const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim();
  if (ogSiteName && ogSiteName.length > 1) {
    try {
      const hostname = new URL(url).hostname;
      if (!isJobBoard(hostname)) return ogSiteName;
    } catch {
      return ogSiteName;
    }
  }

  // 5. Title heuristic — "Position at/@ Company Name"
  const titleText = doc.title || '';
  const atMatch = titleText.match(/\s+(?:at|@|@\s)\s*([A-Z][A-Za-z0-9\s&.,'()-]{1,60}?)(?:\s*[|·–—\-]|\s*$)/);
  if (atMatch?.[1]?.trim()) {
    const candidate = atMatch[1].trim();
    // Don't return if it looks like a job title itself
    if (!/(engineer|manager|developer|designer|analyst|lead|senior|junior)/i.test(candidate)) {
      return candidate;
    }
  }

  // 6. URL domain — last resort for company career sites
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    if (!isJobBoard(hostname)) {
      const domainName = hostname.split('.')[0];
      return domainName.charAt(0).toUpperCase() + domainName.slice(1).replace(/-/g, ' ');
    }
  } catch {}

  return '';
}

function extractJobTitle(doc: Document, readabilityTitle: string): string {
  // 1. JSON-LD JobPosting title
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of Array.from(ldScripts)) {
    try {
      const raw = JSON.parse(script.textContent || '');
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        if (item['@type'] === 'JobPosting' && item.title) return item.title.trim();
        if (Array.isArray(item['@graph'])) {
          for (const node of item['@graph']) {
            if (node['@type'] === 'JobPosting' && node.title) return node.title.trim();
          }
        }
      }
    } catch {}
  }

  // 2. Site-specific title selectors
  const titleSelectors = [
    '[data-testid="jobsearch-JobInfoHeader-title"]',   // Indeed
    '.jobs-unified-top-card__job-title h1',            // LinkedIn
    '.topcard__title',                                 // LinkedIn (old)
    '[data-test="job-title"]',                         // Glassdoor
    'h1.posting-headline',                             // Lever
    'h1[class*="job-title"]',
    'h1[class*="jobTitle"]',
  ];
  for (const sel of titleSelectors) {
    const el = doc.querySelector(sel);
    if (el?.textContent?.trim()) return el.textContent.trim();
  }

  // 3. H1 fallback (most common pattern)
  const h1 = doc.querySelector('h1');
  if (h1?.textContent?.trim()) return h1.textContent.trim();

  return readabilityTitle;
}

chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === 'EXTRACT_JD') {
    try {
      const documentClone = document.cloneNode(true) as Document;
      const reader = new Readability(documentClone);
      const article = reader.parse();

      if (article) {
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(article.content);

        const companyName = extractCompanyName(documentClone, window.location.href);
        const jobTitle = extractJobTitle(documentClone, article.title);

        sendResponse({
          success: true,
          data: {
            title: jobTitle,
            companyName,
            content: markdown,
            textContent: article.textContent,
            url: window.location.href,
            siteName: article.siteName || companyName || '',
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
