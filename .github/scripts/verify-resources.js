#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'crisis-resources.json');

async function verifyUrl(url, timeout = 10000) {
  for (const method of ['HEAD', 'GET']) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'safechat-verify/1.0 (+https://github.com/rob-e-graham/safechat)',
          ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}),
        },
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (res.body) await res.body.cancel();
      // Authentication and bot-protection responses still prove the endpoint exists.
      if (res.ok || [401, 403].includes(res.status)) return true;
      if (method === 'GET' && res.status !== 405) return false;
    } catch {
      clearTimeout(timer);
    }
  }
  return false;
}

function validatePhone(phone) {
  if (!phone) return true; // optional field
  const values = Array.isArray(phone) ? phone : [phone];
  return values.length > 0 && values.every((value) => {
    if (typeof value !== 'string') return false;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 3 && digits.length <= 15;
  });
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

  // Record the automated check separately from human verification.
  if (!data._meta.last_automated_check || data._meta.last_automated_check !== now) {
    data._meta.last_automated_check = now;
    const checkLine = `"last_automated_check": "${now}"`;
    const nextRaw = /"last_automated_check"\s*:\s*"[^"]*"/.test(raw)
      ? raw.replace(/"last_automated_check"\s*:\s*"[^"]*"/, checkLine)
      : raw.replace(/("findahelpline_api"\s*:\s*"[^"]*")(\s*\n\s*})/, `$1,\n    ${checkLine}$2`);
    fs.writeFileSync(DATA_PATH, nextRaw);
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
  console.log(`\nSafechat Automated Resource Check — ${now}`);
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
    console.log('\n✓ All automated checks passed');
  }

  process.exit(failures.length > 0 ? 1 : 0);
}

main();
