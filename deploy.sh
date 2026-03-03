set -e  

APP_NAME="web-portal-staging"
APP_DIR="/var/www/web-portal"
BACKUP_DIR="/var/www/backups"
LOG_DIR="$APP_DIR/logs"
BUILD_DIR="$APP_DIR/build"

echo "🚀 Starting deployment for $APP_NAME..."
echo ""

if [ -f "/tmp/deployment-info.txt" ]; then
    echo "📋 Deployment Information:"
    echo "========================"
    cat /tmp/deployment-info.txt
    echo ""
    sudo cp /tmp/deployment-info.txt "$APP_DIR/deployment-info.txt" 2>/dev/null || true
else
    echo "⚠️  Warning: deployment-info.txt not found"
    echo "   This might indicate the build is from an older deployment process"
    echo ""
fi

echo "📁 Creating directories..."
sudo mkdir -p "$APP_DIR" "$BACKUP_DIR" "$LOG_DIR"

if [ -d "$BUILD_DIR" ]; then
    echo "💾 Creating backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$APP_DIR" build
    echo "✅ Backup created: $BACKUP_NAME.tar.gz"
fi

echo "📦 Extracting new build..."
sudo rm -rf "$BUILD_DIR"
sleep 1

if [ -d "$BUILD_DIR" ]; then
    echo "⚠️  Warning: Old build directory still exists, forcing removal..."
    sudo rm -rf "$BUILD_DIR"
    sleep 1
fi

sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "📥 Extracting build.tar.gz..."
sudo tar -xzf /tmp/build.tar.gz
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ ERROR: Build directory not found at $BUILD_DIR after extraction"
    echo "📋 Contents of $APP_DIR:"
    ls -la "$APP_DIR"
    echo "📋 Checking tar contents:"
    tar -tzf /tmp/build.tar.gz | head -20
    exit 1
fi

echo "📋 Build directory structure:"
ls -la "$BUILD_DIR" | head -10

if [ -z "$(ls -A $BUILD_DIR)" ]; then
    echo "❌ ERROR: Build directory is empty"
    exit 1
fi

echo "✅ Build directory verified at $BUILD_DIR"

echo "🔐 Setting permissions..."
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

sudo mkdir -p "$LOG_DIR"
sudo chown -R $USER:$USER "$LOG_DIR"
sudo chmod -R 755 "$LOG_DIR"

if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
    sudo pm2 startup systemd -u $USER --hp /home/$USER
fi

echo "📦 Copying server files..."
sudo cp /tmp/ecosystem.config.js "$APP_DIR/ecosystem.config.js"
sudo cp /tmp/server.js "$APP_DIR/server.js"
sudo cp /tmp/package.json "$APP_DIR/package.json"
sudo cp /tmp/package-lock.json "$APP_DIR/package-lock.json" 2>/dev/null || echo "⚠️  package-lock.json not found, will use package.json"

echo "📥 Installing Node.js dependencies..."
cd "$APP_DIR"
npm install --production --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed successfully"

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ ERROR: index.html not found in build directory"
    echo "📋 Build directory contents:"
    ls -la "$BUILD_DIR" | head -10
    exit 1
fi
echo "✅ Build directory contains index.html"

JS_REF=$(grep -oP 'main\.\w+\.js' "$BUILD_DIR/index.html" | head -1 || echo "not found")
echo "📄 index.html references JS file: $JS_REF"

echo "📅 Build timestamp verification:"
echo "   index.html modified: $(stat -c %y "$BUILD_DIR/index.html" 2>/dev/null || stat -f "%Sm" "$BUILD_DIR/index.html" 2>/dev/null || echo "unknown")"
echo "   Build directory size: $(du -sh "$BUILD_DIR" | cut -f1)"
echo "   Number of files: $(find "$BUILD_DIR" -type f | wc -l)"

echo "🛑 Stopping existing application..."
cd "$APP_DIR"
pm2 stop "$APP_NAME" || true
pm2 delete "$APP_NAME" || true
sleep 2

MAIN_JS=$(find "$BUILD_DIR/static/js" -name "main.*.js" 2>/dev/null | head -1)
if [ -n "$MAIN_JS" ]; then
    JS_HASH=$(basename "$MAIN_JS" | sed 's/main\.\(.*\)\.js/\1/')
    echo "📦 Deployed JS file hash: $JS_HASH"
    echo "   Full path: $MAIN_JS"
    echo "   File size: $(du -h "$MAIN_JS" | cut -f1)"
    echo "   Modified: $(stat -c %y "$MAIN_JS" 2>/dev/null || stat -f "%Sm" "$MAIN_JS" 2>/dev/null || echo "unknown")"
fi

echo "▶️  Starting application with PM2..."
pm2 start ecosystem.config.js

sleep 3

if ! pm2 list | grep -q "$APP_NAME.*online"; then
    echo "❌ ERROR: Application failed to start!"
    echo "📋 PM2 logs:"
    pm2 logs "$APP_NAME" --lines 20 --nostream
    exit 1
fi

pm2 save

echo "🔍 Final verification:"
echo "   Build directory: $BUILD_DIR"
echo "   PM2 process status:"
pm2 describe "$APP_NAME" | grep -E "(status|pid|uptime|restarts)" || true

echo "📊 Application status:"
pm2 status

if [ -n "$MAIN_JS" ]; then
    echo ""
    echo "✅ Verification complete:"
    echo "   Main JS: $(basename "$MAIN_JS")"
    echo "   This should match the build output: main.8006834c.js"
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployed Version Information:"
if [ -f "$APP_DIR/deployment-info.txt" ]; then
    cat "$APP_DIR/deployment-info.txt"
else
    echo "   (Deployment info not available)"
fi
echo ""
echo "🌐 Application should be running on port 3003"
echo "📝 View logs with: pm2 logs $APP_NAME"
echo ""
echo "🔍 To verify deployment on server, run:"
echo "   # Check deployed commit:"
echo "   cat $APP_DIR/deployment-info.txt"
echo "   # Check if server is responding:"
echo "   curl http://localhost:3003/api/site"
echo "   # Check health endpoint:"
echo "   curl http://localhost:3003/health"
echo ""
echo "⚠️  IMPORTANT: If you see old content in browser:"
echo "   1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   2. Or clear browser cache for this site"
echo "   3. Or open in incognito/private window"
echo "   4. Check DevTools Network tab - ensure files are not from cache"
echo "   5. Verify the commit hash in deployment-info.txt matches your latest commit"

