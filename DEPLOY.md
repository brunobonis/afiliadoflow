# Deploy Scripts

## Railway (Recommended)

1. Create account at railway.app
2. New Project → Add PostgreSQL
3. Connect GitHub repo
4. Add environment variables in Railway dashboard:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-random-secret-here
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NEXT_PUBLIC_SHORT_LINK_DOMAIN=https://your-app.railway.app/go
```

5. Deploy command (automatic on git push):
```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

## Vercel + Supabase

1. Create Supabase project → get PostgreSQL connection string
2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

## VPS Manual Setup

```bash
# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx

# Clone repo
git clone https://github.com/your-repo/afiliadoflow.git
cd afiliadoflow

# Install packages
npm install --legacy-peer-deps

# Setup database
sudo -u postgres createdb afiliadoflow
# Edit .env with production values

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "afiliadoflow" -- start
pm2 save
pm2 startup

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/afiliadoflow
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/afiliadoflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
