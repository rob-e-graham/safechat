#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'crisis-resources.json');

async function verifyUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'safechat-verify/1.0 (+https://github.com/rob-e-graham/safechat)' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    return res.ok || res.status === 405; // some sites reject HEAD
  } catch {
    clearTimeout(timer);
    return false;
  }
}

function validatePhone(phone) {
  if (!phone) return true; // optional field
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 3 && digits.length <= 15;
}

async function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const countries = data.countries;

  const failures = [];
  let updated = false;
  const now = new Date().toISOString().split('T')[0];

  for (const [code, country] of Object.entries(countries)) {
    if (!country.resources || !Array.isArray(country.resources)) continue;

    for (const resource of country.resources) {
      // Validate phone format
      if (resource.phone && !validatePhone(resource.phone)) {
        failures.push({
          country: `${country.name} (${code})`,
          name: resource.name,
          issue: `Invalid phone format: "${resource.phone}"`,
        });
      }

      // Check chat URLs are reachable
      if (resource.chat_url) {
        const ok = await verifyUrl(resource.chat_url);
        if (!ok) {
          failures.push({
            country: `${country.name} (${code})`,
            name: resource.name,
            issue: `Chat URL unreachable: ${resource.chat_url}`,
          });
        }
      }

      // Required fields
      if (!resource.name) {
        failures.push({
          country: `${country.name} (${code})`,
          name: '(unnamed)',
          issue: 'Missing resource name',
        });
      }
      if (!resource.type || resource.type.length === 0) {
        failures.push({
          country: `${country.name} (${code})`,
          name: resource.name,
          issue: 'Missing contact type',
        });
      }
      if (!resource.hours) {
        failures.push({
          country: `${country.name} (${code})`,
          name: resource.name,
          issue: 'Missing hours of operation',
        });
      }
    }
  }

  // Update last_verified timestamp in meta
  if (!data._meta.last_verified || data._meta.last_verified !== now) {
    data._meta.last_verified = now;
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
    updated = true;
  }

  // Output for GitHub Actions
  const core = process.env.GITHUB_OUTPUT;
  if (core) {
    fs.appendFileSync(core, `updated=${updated}\n`);
    if (failures.length > 0) {
      fs.appendFileSync(core, `failures=${JSON.stringify(failures)}\n`);
    }
  }

  // Console report
  console.log(`\nSafechat Resource Verification — ${now}`);
  console.log(`Countries: ${Object.keys(countries).length}`);
  const total = Object.values(countries).reduce((n, c) => n + (c.resources?.length || 0), 0);
  console.log(`Resources: ${total}`);
  console.log(`Issues: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nIssues found:');
    for (const f of failures) {
      console.log(`  ✗ ${f.country} — ${f.name}: ${f.issue}`);
    }
  } else {
    console.log('\n✓ All resources passed validation');
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

main();
