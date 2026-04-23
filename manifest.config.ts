import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from './package.json'

const { version } = packageJson

// Convert from Semver (e.g. 0.1.0-beta6) to Chrome compliant version
const [major, minor, patch, label] = version
  .replace(/[^\d.-]+/g, '')
  .split(/[.-]/)

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: env.mode === 'staging' ? '[INTERNAL] JobFit AI v2' : 'JobFit AI - Resume & JD Optimizer',
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}${label ? `.${label}` : ''}`,
  version_name: version,
  action: {
    default_title: 'Open JobFit AI',
  },
  side_panel: {
    default_path: 'index.html',
  },
  permissions: [
    'sidePanel',
    'activeTab',
    'storage',
    'identity',
    'offscreen',
    'scripting'
  ],
  host_permissions: [
    'https://*.supabase.co/*',
    'https://api.jobfit.ai/*',
    'https://accounts.google.com/*',
    'https://*.googleusercontent.com/*',
    'https://api.anthropic.com/*',
    'https://api.voyageai.com/*'
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      js: ['src/content/index.ts'],
      matches: ['<all_urls>'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/offscreen/index.html'],
      matches: ['<all_urls>'],
    },
  ],
}))
