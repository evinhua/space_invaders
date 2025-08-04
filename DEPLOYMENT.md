# 🚀 Deployment Guide

This guide covers various deployment options for the Enhanced Space Invaders game.

## 🌐 Vercel (Recommended)

Vercel provides the easiest deployment for Next.js applications.

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/evinhua/space_invaders)

### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow the prompts to configure your deployment
```

### Environment Variables
Set these in your Vercel dashboard:
```
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 🐳 Docker

### Build and Run
```bash
# Build the Docker image
docker build -t space-invaders .

# Run the container
docker run -p 3000:3000 space-invaders
```

### Docker Compose
```yaml
version: '3.8'
services:
  space-invaders:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./db/custom.db
      - NEXTAUTH_SECRET=your-secret-key-here
```

## ☁️ Netlify

### Deploy from Git
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Build Settings
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
```

## 🔧 Manual Server Deployment

### Prerequisites
- Node.js 18+
- PM2 (for process management)

### Steps
```bash
# Clone repository
git clone https://github.com/evinhua/space_invaders.git
cd space_invaders

# Install dependencies
npm install

# Build the application
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "space-invaders" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🌍 Environment Variables

### Required
- `DATABASE_URL`: Database connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js

### Optional
- `NEXTAUTH_URL`: Your deployment URL
- `NODE_ENV`: Set to `production` for production builds

## 📊 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Enable compression
# Add to next.config.ts:
compress: true,
```

### CDN Configuration
- Enable static asset caching
- Configure proper cache headers
- Use image optimization services

## 🔒 Security Considerations

### Headers
Add security headers in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ]
}
```

### Environment Security
- Never commit secrets to Git
- Use environment-specific configurations
- Enable HTTPS in production
- Regular security updates

## 📈 Monitoring

### Performance Monitoring
- Set up Vercel Analytics
- Monitor Core Web Vitals
- Track error rates and performance metrics

### Logging
```bash
# View PM2 logs
pm2 logs space-invaders

# Monitor with PM2
pm2 monit
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Database Issues**: Ensure DATABASE_URL is correctly set
3. **Performance Issues**: Enable compression and optimize images
4. **Socket.IO Issues**: Configure WebSocket support on your platform

### Debug Mode
Enable debug mode by setting `showDebug=true` in the game component to see:
- FPS counter
- Entity counts
- Performance metrics
- Keyboard input status

## 📞 Support

If you encounter deployment issues:
1. Check the [GitHub Issues](https://github.com/evinhua/space_invaders/issues)
2. Review the deployment platform's documentation
3. Enable debug mode to identify performance issues
4. Check browser console for client-side errors

---

Happy deploying! 🎮🚀
