#!/bin/bash

set -e

echo "🚀 Starting CodeGPM deployment..."

cd /home/ubuntu/Group-Project-Manager

echo "🧹 Cleaning local changes..."
git restore Frontend/package-lock.json || true

echo "📥 Pulling latest code..."
git pull --rebase origin main

echo "📦 Installing backend dependencies..."
cd Backend
npm ci

echo "🔄 Restarting backend..."
pm2 restart codegpm-api --update-env

echo "📦 Installing frontend dependencies..."
cd ../Frontend
npm ci

echo "🏗️ Building frontend..."
npm run build

echo "🌐 Deploying frontend..."
sudo rm -rf /var/www/codegpm/*
sudo cp -r dist/* /var/www/codegpm/

echo "🔄 Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ CodeGPM deployment complete!"