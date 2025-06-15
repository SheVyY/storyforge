# StoryForge CI/CD Setup Guide

## Phase 1 Pipeline Overview

✅ **Code Quality & Security** (5-10 min)  
✅ **Unit & Integration Tests** (5 min)  
✅ **E2E Tests** (Cross-browser: Chrome, Firefox, Safari)  
✅ **Build & Docker** (5 min)  
✅ **Performance Testing** (Lighthouse CI)  
✅ **Automated Deployment** (Vercel)  

## 🚀 Vercel Setup Instructions

### 1. Connect Repository to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import `SheVyY/storyforge` repository
4. **Framework Preset**: Vite
5. **Root Directory**: `./` (default)
6. **Build Command**: `npm run build` (auto-detected)
7. **Output Directory**: `dist` (auto-detected)
8. **Install Command**: `npm ci` (auto-detected)

### 2. Configure Environment Variables
In Vercel project settings, add these environment variables:

```bash
# No environment variables needed for Phase 1
# Future AI phase will need:
# - MODEL_CDN_URL
# - ANALYTICS_ID
```

### 3. Get Vercel Secrets for GitHub Actions
Run these commands in your terminal:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run in repository root)
vercel link

# Get organization and project IDs
vercel env ls
```

### 4. Add GitHub Secrets
Go to `https://github.com/SheVyY/storyforge/settings/secrets/actions` and add:

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>  
VERCEL_PROJECT_ID=<your-project-id>
```

**To get your Vercel token:**
1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create new token with name "GitHub Actions StoryForge"
3. Copy the token value

## 📋 Pipeline Features

### Automated Testing
- **Unit Tests**: Vitest with coverage reporting
- **Integration Tests**: Docker-based testing
- **E2E Tests**: Playwright across 3 browsers
- **Performance**: Lighthouse CI with budget enforcement

### Code Quality Gates
- **TypeScript**: Strict compilation checks
- **Security**: npm audit for vulnerabilities  
- **Dependencies**: Automated updates via Dependabot
- **Bundle Analysis**: Size tracking and optimization

### Deployment Strategy
- **Preview Deployments**: Every PR gets a preview URL
- **Production Deployment**: Automatic on main branch push
- **Health Checks**: Post-deployment validation
- **Performance Monitoring**: Core Web Vitals tracking

### Branch Protection (Recommended)
In GitHub repository settings, enable:
- ✅ Require pull request reviews
- ✅ Require status checks (CI pipeline)
- ✅ Require branches to be up to date
- ✅ Include administrators

## 🔧 Local Development Integration

```bash
# Run full CI pipeline locally
npm run ci

# Individual steps
npm run lint          # TypeScript check
npm run test:run      # Unit tests  
npm run test:e2e      # E2E tests
npm run build         # Production build

# Deploy manually
npm run deploy        # Build + deploy to Vercel
```

## 📊 Monitoring & Analytics

### Vercel Analytics (Included)
- Core Web Vitals tracking
- Real User Monitoring (RUM)
- Performance insights

### Optional Enhancements
- **Error Tracking**: Sentry integration
- **Bundle Analysis**: Built into CI pipeline
- **Uptime Monitoring**: Vercel provides basic uptime

## 🚨 Performance Budgets

Current Lighthouse CI thresholds:
- **Performance**: ≥80% (warn)
- **Accessibility**: ≥90% (error)
- **Best Practices**: ≥80% (warn)
- **SEO**: ≥80% (warn)
- **PWA**: ≥60% (warn)

## 🔄 Deployment Flow

```
Code Push → GitHub Actions CI → Tests Pass → Vercel Build → Deploy → Health Check
     ↓              ↓                ↓           ↓          ↓          ↓
   Trigger      Quality Gates    E2E Tests   Optimize   Go Live   Validate
```

### Preview Deployments
- Every PR gets unique preview URL: `storyforge-git-branch-shevyy.vercel.app`
- Automatic comments with deployment links
- Perfect for testing and reviews

### Production Deployments  
- Triggered on main branch push
- URL: `storyforge.vercel.app` (or custom domain)
- Automatic rollback on health check failure

## ⚡ Performance Optimizations

### Vercel Edge Network
- Global CDN with 100+ edge locations
- Automatic static optimization
- Brotli compression enabled

### Build Optimizations
- Vite tree-shaking and code splitting
- Asset optimization and caching
- Bundle size monitoring

### Headers Configuration
- **COOP/COEP**: Ready for SharedArrayBuffer (AI models)
- **Cache-Control**: Optimized for static assets
- **Security**: XSS protection, HTTPS enforcement

## 🎯 Next Steps After Setup

1. **Test the Pipeline**: Create a PR and verify all checks pass
2. **Monitor Performance**: Check Vercel analytics dashboard  
3. **Optimize Bundle**: Review bundle analysis reports
4. **Security**: Enable CodeQL scanning for advanced security
5. **Documentation**: Update README with deployment status badges

## 🔗 Useful Links

- **Live App**: https://storyforge.vercel.app (after setup)
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/SheVyY/storyforge/actions
- **Performance**: Lighthouse CI reports in PR comments

---

**Status**: Ready for setup ✅  
**Estimated Setup Time**: 15-20 minutes  
**Deployment Time**: ~2 minutes per deploy