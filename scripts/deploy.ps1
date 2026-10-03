<# 
  PocketSmart AI — Production Deployment Script
  Deploys backend to Google Cloud Run and frontend proxy via Firebase Hosting.
  
  Prerequisites:
  1. Node.js installed (for Firebase CLI)
  2. Google Cloud SDK installed (gcloud CLI)
  3. Firebase CLI installed (npm install -g firebase-tools)
  4. Docker Desktop or Docker Engine running
  
  Usage:
    .\scripts\deploy.ps1
#>

$ErrorActionPreference = "Stop"

# ===== Configuration =====
$PROJECT_ID = "pocketsmartai"
$REGION = "asia-south1"
$SERVICE_NAME = "pocketsmart-ai"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PocketSmart AI — Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ===== Step 1: Verify Prerequisites =====
Write-Host "[1/7] Verifying prerequisites..." -ForegroundColor Yellow

# Check gcloud
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "  ✓ Google Cloud SDK: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Check Firebase CLI
try {
    $firebaseVersion = firebase --version 2>&1
    Write-Host "  ✓ Firebase CLI: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Firebase CLI not found. Run: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "  ✓ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker not found. Install Docker Desktop from: https://docker.com" -ForegroundColor Red
    exit 1
}

# ===== Step 2: Authenticate =====
Write-Host ""
Write-Host "[2/7] Checking Google Cloud authentication..." -ForegroundColor Yellow

$currentAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
if (-not $currentAccount) {
    Write-Host "  Logging in to Google Cloud..." -ForegroundColor Cyan
    gcloud auth login
    gcloud auth application-default login
} else {
    Write-Host "  ✓ Authenticated as: $currentAccount" -ForegroundColor Green
}

# Set project
gcloud config set project $PROJECT_ID
Write-Host "  ✓ Project set to: $PROJECT_ID" -ForegroundColor Green

# ===== Step 3: Enable Required APIs =====
Write-Host ""
Write-Host "[3/7] Enabling required Google Cloud APIs..." -ForegroundColor Yellow

$apis = @(
    "run.googleapis.com",
    "containerregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "  Enabling $api..."
    gcloud services enable $api --quiet 2>$null
}
Write-Host "  ✓ All APIs enabled" -ForegroundColor Green

# ===== Step 4: Build & Push Docker Image =====
Write-Host ""
Write-Host "[4/7] Building and pushing Docker image..." -ForegroundColor Yellow

# Configure Docker to use gcloud credentials for GCR
gcloud auth configure-docker --quiet 2>$null

# Build the image
Write-Host "  Building Docker image..."
docker build -t "${IMAGE_NAME}:latest" .

# Push to Google Container Registry
Write-Host "  Pushing to Google Container Registry..."
docker push "${IMAGE_NAME}:latest"

Write-Host "  ✓ Image pushed: ${IMAGE_NAME}:latest" -ForegroundColor Green

# ===== Step 5: Deploy to Cloud Run =====
Write-Host ""
Write-Host "[5/7] Deploying to Cloud Run..." -ForegroundColor Yellow

# Read environment variables from .env for production
$envVars = @(
    "APP_ENV=production",
    "APP_NAME=PocketSmart AI",
    "DEBUG=False",
    "CORS_ORIGINS=*"
)

# Prompt for sensitive values
$geminiKey = Read-Host "  Enter your GEMINI_API_KEY for production"
$secretKey = Read-Host "  Enter a strong SECRET_KEY for JWT (min 32 chars)"

if ($geminiKey) {
    $envVars += "GEMINI_API_KEY=$geminiKey"
}
$envVars += "GEMINI_MODEL=gemini-3.5-flash-lite"

if ($secretKey) {
    $envVars += "SECRET_KEY=$secretKey"
} else {
    $envVars += "SECRET_KEY=pocketsmart-production-$(Get-Random -Maximum 999999)-secure-key"
}

$envVarString = $envVars -join ","

gcloud run deploy $SERVICE_NAME `
    --image "${IMAGE_NAME}:latest" `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 3 `
    --timeout 60 `
    --set-env-vars $envVarString `
    --quiet

# Get the Cloud Run URL
$serviceUrl = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>$null
Write-Host "  ✓ Cloud Run deployed: $serviceUrl" -ForegroundColor Green

# ===== Step 6: Deploy Firebase Hosting =====
Write-Host ""
Write-Host "[6/7] Deploying Firebase Hosting (reverse proxy)..." -ForegroundColor Yellow

# Login to Firebase
firebase login --no-localhost 2>$null

# Use the project
firebase use $PROJECT_ID 2>$null

# Deploy hosting
firebase deploy --only hosting

Write-Host "  ✓ Firebase Hosting deployed" -ForegroundColor Green

# ===== Step 7: Summary =====
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " ✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Cloud Run Backend:  $serviceUrl" -ForegroundColor Cyan
Write-Host "  Firebase Hosting:   https://${PROJECT_ID}.web.app" -ForegroundColor Cyan
Write-Host "  Health Check:       ${serviceUrl}/health" -ForegroundColor Cyan
Write-Host "  API Docs:           ${serviceUrl}/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To view logs:  gcloud run services logs read $SERVICE_NAME --region $REGION" -ForegroundColor Gray
Write-Host ""
