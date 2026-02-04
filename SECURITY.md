# Security Policy

## Vulnerability Status

### CVE-2025-55182 (React2Shell)
**Status**: ✅ **NOT VULNERABLE**

This application is not affected by CVE-2025-55182 because:
- Uses React 18.2.0 (vulnerability affects React 19)
- Vite SPA architecture (no Next.js App Router or Server Components)
- No RSC/Flight protocol endpoints

## Security Measures

### API Protection
- ✅ Rate limiting (100 req/15min for IPC, 30 req/15min for scraping)
- ✅ CORS restrictions to authorized origins only
- ✅ Request method validation (GET only)
- ✅ Timeout protection (10-15s)
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)

### Environment Security
- ✅ Environment variables excluded from version control
- ✅ `.env.example` template provided
- ✅ Supabase credentials isolated

### Client-Side Security
- ✅ Content Security Policy (CSP)
- ✅ XSS protection headers
- ✅ Clickjacking prevention
- ✅ HTTPS enforcement (HSTS)

## Reporting a Vulnerability

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email the maintainer with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Checklist

### Regular Maintenance
- [ ] Run `npm audit` weekly
- [ ] Update dependencies monthly
- [ ] Review Vercel function logs for anomalies
- [ ] Monitor Supabase audit logs
- [ ] Check rate limit violations

### After Deployment
- [ ] Verify security headers are present
- [ ] Test CORS restrictions
- [ ] Confirm rate limiting works
- [ ] Check CSP compliance in browser console

### Credential Rotation Schedule
- Rotate Supabase keys: Every 90 days or immediately if exposed
- Review authorized origins: Monthly
- Update API timeouts: As needed based on performance

## Incident Response Plan

### If Credentials Are Exposed

1. **Immediate Actions** (within 1 hour):
   - Rotate all Supabase keys (anon + service_role)
   - Update Vercel environment variables
   - Review recent database changes
   - Check for unauthorized API calls

2. **Investigation** (within 24 hours):
   - Review git history for malicious commits
   - Check Vercel deployment logs
   - Audit Supabase RLS policies
   - Scan for backdoors in code

3. **Recovery** (within 48 hours):
   - Deploy updated credentials
   - Monitor for suspicious activity
   - Document incident and lessons learned
   - Update security measures as needed

### If Under Attack

1. **Immediate**:
   - Check Vercel function logs for attack patterns
   - Temporarily reduce rate limits if needed
   - Block malicious IPs via Vercel firewall

2. **Short-term**:
   - Enable Vercel DDoS protection
   - Add additional rate limiting layers
   - Consider adding authentication to API endpoints

3. **Long-term**:
   - Implement request signing
   - Add API key authentication
   - Consider moving to Vercel Edge Functions for better performance

## Dependencies

### Known Vulnerabilities
Run `npm audit` to check for current vulnerabilities.

### Update Policy
- **Critical vulnerabilities**: Patch within 24 hours
- **High vulnerabilities**: Patch within 1 week
- **Medium/Low vulnerabilities**: Patch during regular maintenance

## Contact

For security concerns, contact the project maintainer.

---

**Last Updated**: 2026-02-04  
**Next Review**: 2026-05-04
