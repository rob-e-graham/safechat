# Contributing to Safechat

The most impactful contribution is keeping crisis resources accurate and expanding coverage.

## Adding or updating a country

1. Fork the repo and create a branch
2. Edit `data/crisis-resources.json`
3. Follow the existing format exactly
4. Submit a PR with your changes

### Entry format

```json
{
  "XX": {
    "name": "Country Name",
    "emergency": "Emergency number",
    "resources": [
      {
        "name": "Organization Name",
        "type": ["phone", "text", "chat", "email"],
        "phone": "Phone number",
        "sms": "Text instructions",
        "chat_url": "https://...",
        "email": "email@example.com",
        "hours": "24/7 or specific hours",
        "languages": ["en"],
        "specialties": ["crisis", "suicide", "youth", "lgbtq", "veterans", "indigenous"],
        "verified": true
      }
    ]
  }
}
```

### Verification checklist

Before submitting, please confirm:

- [ ] The helpline is currently operational
- [ ] The phone number is correct and reachable
- [ ] The hours of operation are accurate
- [ ] The organization name is current
- [ ] You've included a source URL in your PR description
- [ ] Set `verified: true` only if you personally confirmed the information

### What counts as a source

- Official government mental health pages
- WHO or IASP directories
- The organization's own website
- findahelpline.com listings

### Priority additions needed

Countries with large populations not yet in the database. If you're from one of these countries and know the local crisis lines, your contribution could literally save lives.

## Code contributions

- Keep the API simple. The one-call `check()` function should stay one call.
- The detector runs locally with zero network calls. Keep it that way.
- Browser bundle must work without any build step or bundler.
- Tests must pass: `node test/run.js`

## Safe messaging

This project follows Samaritans safe messaging guidelines. In all code, docs, and issues:

- Never describe methods of self-harm
- Use "died by suicide" not "committed suicide"
- Always pair mention of struggle with a resource
- Don't sensationalize
