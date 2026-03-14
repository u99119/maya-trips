#!/usr/bin/env node

/**
 * Debug Cloudflare API Connection
 * This script helps diagnose issues with Cloudflare API access
 */

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_FILE = join(homedir(), '.ms-usage-config.json');

console.log('🔍 Cloudflare API Debug Tool\n');

// Load config
let config;
try {
  config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  console.log('✓ Config loaded from:', CONFIG_FILE);
} catch (error) {
  console.error('✗ Could not load config file');
  process.exit(1);
}

const { apiToken, accountId, projectName } = config.cloudflare;

console.log('\n📋 Configuration:');
console.log('  Account ID:', accountId);
console.log('  Project Name:', projectName);
console.log('  API Token:', apiToken ? `${apiToken.substring(0, 10)}...` : 'NOT SET');

// Test 1: List all Pages projects
console.log('\n\n🧪 Test 1: List ALL Pages projects in your account');
console.log('━'.repeat(60));

const listUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`;
console.log('URL:', listUrl);

try {
  const response = await fetch(listUrl, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('Status:', response.status, response.statusText);
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('\n✓ SUCCESS! Found', data.result.length, 'Pages project(s):\n');
    
    if (data.result.length === 0) {
      console.log('  ⚠️  No Pages projects found in this account!');
      console.log('  Make sure you have deployed to Cloudflare Pages.');
    } else {
      data.result.forEach((project, index) => {
        console.log(`  ${index + 1}. Name: "${project.name}"`);
        console.log(`     URL: ${project.domains?.[0] || 'N/A'}`);
        console.log(`     Created: ${new Date(project.created_on).toLocaleDateString()}`);
        console.log('');
      });
      
      // Check if our project exists
      const ourProject = data.result.find(p => p.name === projectName);
      if (ourProject) {
        console.log(`✓ Found your project: "${projectName}"`);
      } else {
        console.log(`✗ Project "${projectName}" NOT FOUND in the list above!`);
        console.log(`\n💡 Solution: Update your config to use one of the project names listed above.`);
      }
    }
  } else {
    console.log('\n✗ API Error:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.status === 403) {
      console.log('\n💡 403 Forbidden - Your API token does not have permission.');
      console.log('   Make sure the token has: Account.Cloudflare Pages:Read');
    } else if (response.status === 404) {
      console.log('\n💡 404 Not Found - Account ID might be wrong.');
      console.log('   Double-check your Account ID in Cloudflare dashboard.');
    }
  }
} catch (error) {
  console.log('\n✗ Request failed:', error.message);
}

// Test 2: Try to get specific project
console.log('\n\n🧪 Test 2: Get specific project:', projectName);
console.log('━'.repeat(60));

const projectUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
console.log('URL:', projectUrl);

try {
  const response = await fetch(projectUrl, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('Status:', response.status, response.statusText);
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('\n✓ SUCCESS! Project details:');
    console.log(JSON.stringify(data.result, null, 2));
  } else {
    console.log('\n✗ Failed to get project');
    console.log(JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log('\n✗ Request failed:', error.message);
}

console.log('\n\n━'.repeat(60));
console.log('🏁 Debug complete!\n');

