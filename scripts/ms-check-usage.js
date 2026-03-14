#!/usr/bin/env node

/**
 * Multi-Service Usage Checker
 * 
 * Checks usage statistics for:
 * - Firebase (Authentication, Firestore, Storage)
 * - Cloudflare Pages
 * - Netlify
 * 
 * Usage: node scripts/ms-check-usage.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createInterface } from 'readline';

const CONFIG_FILE = join(homedir(), '.ms-usage-config.json');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Helper to read user input
function prompt(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Load or create configuration
async function loadConfig() {
  if (existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
      console.log(`${colors.green}✓${colors.reset} Loaded saved credentials from ${colors.dim}${CONFIG_FILE}${colors.reset}\n`);
      return config;
    } catch (error) {
      console.log(`${colors.yellow}⚠${colors.reset} Could not read config file, will create new one\n`);
    }
  }

  console.log(`${colors.cyan}${colors.bright}First-time setup: Please provide your API credentials${colors.reset}\n`);
  
  const config = {
    firebase: {},
    cloudflare: {},
    netlify: {},
  };

  // Firebase setup
  console.log(`${colors.blue}━━━ Firebase Setup ━━━${colors.reset}`);
  console.log('Get your service account key from:');
  console.log('https://console.firebase.google.com/project/maya-family-trips/settings/serviceaccounts/adminsdk\n');
  
  const firebaseKeyPath = await prompt('Path to Firebase service account JSON file (or press Enter to skip): ');
  if (firebaseKeyPath) {
    config.firebase.serviceAccountPath = firebaseKeyPath;
    config.firebase.projectId = 'maya-family-trips';
  }

  // Cloudflare setup
  console.log(`\n${colors.blue}━━━ Cloudflare Setup ━━━${colors.reset}`);
  console.log('Get your API token from:');
  console.log('https://dash.cloudflare.com/profile/api-tokens\n');
  console.log('Required permissions: Account.Cloudflare Pages:Read\n');
  
  const cfToken = await prompt('Cloudflare API Token (or press Enter to skip): ');
  if (cfToken) {
    config.cloudflare.apiToken = cfToken;
    const cfAccountId = await prompt('Cloudflare Account ID: ');
    config.cloudflare.accountId = cfAccountId;
    const cfProjectName = await prompt('Cloudflare Pages Project Name (default: maya-trips): ');
    config.cloudflare.projectName = cfProjectName || 'maya-trips';
  }

  // Netlify setup
  console.log(`\n${colors.blue}━━━ Netlify Setup ━━━${colors.reset}`);
  console.log('Get your personal access token from:');
  console.log('https://app.netlify.com/user/applications#personal-access-tokens\n');
  
  const netlifyToken = await prompt('Netlify Personal Access Token (or press Enter to skip): ');
  if (netlifyToken) {
    config.netlify.accessToken = netlifyToken;
  }

  // Save configuration
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`\n${colors.green}✓${colors.reset} Configuration saved to ${colors.dim}${CONFIG_FILE}${colors.reset}\n`);
  
  return config;
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Print table header
function printTableHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}╔${'═'.repeat(78)}╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset} ${colors.bright}${title.padEnd(76)}${colors.reset} ${colors.bright}${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚${'═'.repeat(78)}╝${colors.reset}\n`);
}

// Print table row
function printRow(label, value, limit = null, unit = '') {
  const labelPart = `  ${label}`.padEnd(40);
  let valuePart = value.toString().padStart(15);

  if (limit !== null) {
    const percentage = (parseFloat(value.replace(/,/g, '')) / limit) * 100;
    const limitStr = formatNumber(limit);
    valuePart += ` / ${limitStr}${unit}`.padEnd(20);

    let color = colors.green;
    if (percentage > 80) color = colors.red;
    else if (percentage > 60) color = colors.yellow;

    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    console.log(`${labelPart}${color}${valuePart}${colors.reset} ${color}${bar}${colors.reset} ${color}${percentage.toFixed(1)}%${colors.reset}`);
  } else {
    console.log(`${labelPart}${colors.white}${valuePart}${unit}${colors.reset}`);
  }
}

// Firebase usage check
async function checkFirebaseUsage(config) {
  if (!config.firebase.serviceAccountPath) {
    console.log(`${colors.yellow}⚠ Firebase credentials not configured. Skipping...${colors.reset}`);
    return;
  }

  printTableHeader('🔥 FIREBASE USAGE (maya-family-trips)');

  try {
    // Note: Firebase Admin SDK doesn't provide usage metrics directly
    // We'll use Firebase REST API or show what we can from the config
    console.log(`${colors.dim}  Project ID:${colors.reset} maya-family-trips`);
    console.log(`${colors.dim}  Region:${colors.reset} asia-south1\n`);

    console.log(`${colors.yellow}  ℹ Firebase Usage Metrics:${colors.reset}`);
    console.log(`  Firebase doesn't provide programmatic access to usage quotas.`);
    console.log(`  Please check manually at:`);
    console.log(`  ${colors.cyan}https://console.firebase.google.com/project/maya-family-trips/usage${colors.reset}\n`);

    // Show free tier limits for reference
    console.log(`${colors.bright}  Free Tier Limits (Spark Plan):${colors.reset}`);
    printRow('Authentication Users', 'N/A', null, ' (10K/month limit)');
    printRow('Firestore Reads', 'N/A', null, ' (50K/day limit)');
    printRow('Firestore Writes', 'N/A', null, ' (20K/day limit)');
    printRow('Firestore Deletes', 'N/A', null, ' (20K/day limit)');
    printRow('Firestore Storage', 'N/A', null, ' (1GB limit)');
    printRow('Storage Downloads', 'N/A', null, ' (1GB/day limit)');
    printRow('Storage Space', 'N/A', null, ' (5GB limit)');

  } catch (error) {
    console.log(`${colors.red}✗ Error checking Firebase: ${error.message}${colors.reset}`);
  }
}

// Cloudflare Pages usage check
async function checkCloudflareUsage(config) {
  if (!config.cloudflare.apiToken) {
    console.log(`${colors.yellow}⚠ Cloudflare credentials not configured. Skipping...${colors.reset}`);
    return;
  }

  printTableHeader(`☁️  CLOUDFLARE PAGES USAGE (${config.cloudflare.projectName || 'maya-trips'})`);

  try {
    const accountId = config.cloudflare.accountId;
    const projectName = config.cloudflare.projectName;

    // Get project info
    const projectUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
    const projectResponse = await fetch(projectUrl, {
      headers: {
        'Authorization': `Bearer ${config.cloudflare.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectResponse.ok) {
      throw new Error(`API returned ${projectResponse.status}: ${projectResponse.statusText}`);
    }

    const projectData = await projectResponse.json();

    if (!projectData.success) {
      throw new Error('Failed to fetch project data');
    }

    const project = projectData.result;

    console.log(`${colors.dim}  Project:${colors.reset} ${project.name}`);
    console.log(`${colors.dim}  Production URL:${colors.reset} ${project.domains?.[0] || 'N/A'}`);
    console.log(`${colors.dim}  Created:${colors.reset} ${new Date(project.created_on).toLocaleDateString()}\n`);

    // Get deployments
    const deploymentsUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`;
    const deploymentsResponse = await fetch(deploymentsUrl, {
      headers: {
        'Authorization': `Bearer ${config.cloudflare.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const deploymentsData = await deploymentsResponse.json();
    const deployments = deploymentsData.result || [];

    console.log(`${colors.bright}  Deployment Statistics:${colors.reset}`);
    printRow('Total Deployments', formatNumber(deployments.length));

    const successfulDeployments = deployments.filter(d => d.latest_stage?.status === 'success').length;
    printRow('Successful Deployments', formatNumber(successfulDeployments));

    const failedDeployments = deployments.filter(d => d.latest_stage?.status === 'failure').length;
    printRow('Failed Deployments', formatNumber(failedDeployments));

    if (deployments.length > 0) {
      const latestDeployment = deployments[0];
      console.log(`\n${colors.bright}  Latest Deployment:${colors.reset}`);
      printRow('Status', latestDeployment.latest_stage?.status || 'unknown');
      printRow('Branch', latestDeployment.deployment_trigger?.metadata?.branch || 'N/A');
      printRow('Deployed', new Date(latestDeployment.created_on).toLocaleString());
    }

    console.log(`\n${colors.dim}  Note: Cloudflare Pages free tier includes:${colors.reset}`);
    console.log(`  ${colors.dim}• 500 builds/month${colors.reset}`);
    console.log(`  ${colors.dim}• Unlimited bandwidth${colors.reset}`);
    console.log(`  ${colors.dim}• Unlimited requests${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}✗ Error checking Cloudflare: ${error.message}${colors.reset}`);
    console.log(`${colors.dim}  Check your API token and account ID${colors.reset}`);
  }
}

// Netlify usage check
async function checkNetlifyUsage(config) {
  if (!config.netlify.accessToken) {
    console.log(`${colors.yellow}⚠ Netlify credentials not configured. Skipping...${colors.reset}`);
    return;
  }

  printTableHeader('🌐 NETLIFY USAGE');

  try {
    // Get account info
    const accountUrl = 'https://api.netlify.com/api/v1/accounts';
    const accountResponse = await fetch(accountUrl, {
      headers: {
        'Authorization': `Bearer ${config.netlify.accessToken}`,
      },
    });

    if (!accountResponse.ok) {
      throw new Error(`API returned ${accountResponse.status}: ${accountResponse.statusText}`);
    }

    const accounts = await accountResponse.json();
    const account = accounts[0];

    if (account) {
      console.log(`${colors.dim}  Account:${colors.reset} ${account.name}`);
      console.log(`${colors.dim}  Type:${colors.reset} ${account.type_name}\n`);
    }

    // Get sites
    const sitesUrl = 'https://api.netlify.com/api/v1/sites';
    const sitesResponse = await fetch(sitesUrl, {
      headers: {
        'Authorization': `Bearer ${config.netlify.accessToken}`,
      },
    });

    const sites = await sitesResponse.json();

    console.log(`${colors.bright}  Sites:${colors.reset}`);
    printRow('Total Sites', formatNumber(sites.length));

    for (const site of sites.slice(0, 5)) { // Show first 5 sites
      console.log(`\n${colors.bright}  Site: ${site.name}${colors.reset}`);
      printRow('URL', site.url || 'N/A');
      printRow('Status', site.published_deploy ? 'Published' : 'Not published');

      if (site.published_deploy) {
        printRow('Last Deploy', new Date(site.published_deploy.created_at).toLocaleString());
      }

      // Get bandwidth usage (if available)
      if (account) {
        const bandwidthUrl = `https://api.netlify.com/api/v1/accounts/${account.slug}/bandwidth`;
        try {
          const bandwidthResponse = await fetch(bandwidthUrl, {
            headers: {
              'Authorization': `Bearer ${config.netlify.accessToken}`,
            },
          });

          if (bandwidthResponse.ok) {
            const bandwidth = await bandwidthResponse.json();
            if (bandwidth.used !== undefined) {
              printRow('Bandwidth Used', formatBytes(bandwidth.used));
            }
          }
        } catch (e) {
          // Bandwidth endpoint might not be available for all plans
        }
      }
    }

    console.log(`\n${colors.dim}  Note: Netlify free tier includes:${colors.reset}`);
    console.log(`  ${colors.dim}• 100GB bandwidth/month${colors.reset}`);
    console.log(`  ${colors.dim}• 300 build minutes/month${colors.reset}`);
    console.log(`  ${colors.dim}• Unlimited sites${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}✗ Error checking Netlify: ${error.message}${colors.reset}`);
    console.log(`${colors.dim}  Check your access token${colors.reset}`);
  }
}

// Show help
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}Multi-Service Usage Checker${colors.reset}

${colors.bright}USAGE:${colors.reset}
  node scripts/ms-check-usage.js [options]
  npm run check-usage

${colors.bright}OPTIONS:${colors.reset}
  --help, -h          Show this help message
  --reconfigure       Delete saved config and reconfigure
  --firebase-only     Check only Firebase usage
  --cloudflare-only   Check only Cloudflare usage
  --netlify-only      Check only Netlify usage

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.dim}# Check all services${colors.reset}
  npm run check-usage

  ${colors.dim}# Reconfigure credentials${colors.reset}
  node scripts/ms-check-usage.js --reconfigure

  ${colors.dim}# Check only Cloudflare${colors.reset}
  node scripts/ms-check-usage.js --cloudflare-only

${colors.bright}FIRST TIME SETUP:${colors.reset}
  See: docs/check-usage/USAGE-CHECKER-QUICKSTART.md

${colors.bright}CREDENTIALS STORED IN:${colors.reset}
  ${CONFIG_FILE}

${colors.bright}DOCUMENTATION:${colors.reset}
  docs/check-usage/USAGE-CHECKER-SETUP.md
  docs/check-usage/USAGE-CHECKER-QUICKSTART.md
  docs/check-usage/CREDENTIALS-TEMPLATE.md
  docs/check-usage/USAGE-CHECKER-SUMMARY.md
`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  // Handle help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // Handle reconfigure
  if (args.includes('--reconfigure')) {
    if (existsSync(CONFIG_FILE)) {
      const fs = await import('fs');
      fs.unlinkSync(CONFIG_FILE);
      console.log(`${colors.green}✓${colors.reset} Configuration deleted. Run again to reconfigure.\n`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} No configuration file found.\n`);
    }
    return;
  }

  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    MULTI-SERVICE USAGE CHECKER                                 ║');
  console.log('║                    Firebase • Cloudflare • Netlify                             ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    // Load configuration
    const config = await loadConfig();

    // Check which services to run
    const firebaseOnly = args.includes('--firebase-only');
    const cloudflareOnly = args.includes('--cloudflare-only');
    const netlifyOnly = args.includes('--netlify-only');
    const checkAll = !firebaseOnly && !cloudflareOnly && !netlifyOnly;

    // Check each service
    if (checkAll || firebaseOnly) {
      await checkFirebaseUsage(config);
    }

    if (checkAll || cloudflareOnly) {
      await checkCloudflareUsage(config);
    }

    if (checkAll || netlifyOnly) {
      await checkNetlifyUsage(config);
    }

    // Summary
    console.log(`\n${colors.bright}${colors.green}╔${'═'.repeat(78)}╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║${colors.reset} ${colors.bright}✓ Usage check complete!${' '.repeat(54)}${colors.reset} ${colors.bright}${colors.green}║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚${'═'.repeat(78)}╝${colors.reset}\n`);

    console.log(`${colors.dim}Configuration: ${CONFIG_FILE}${colors.reset}`);
    console.log(`${colors.dim}To reconfigure: node scripts/ms-check-usage.js --reconfigure${colors.reset}`);
    console.log(`${colors.dim}For help: node scripts/ms-check-usage.js --help${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}✗ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);


