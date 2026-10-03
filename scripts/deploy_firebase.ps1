# PocketSmart AI - Firebase & Cloud Run Deployment Script
Write-Host "============================================================"
Write-Host "PocketSmart AI - Firebase Production Deployment"
Write-Host "Project ID: pocketsmartai-app"
Write-Host "============================================================"

# Define node and firebase CLI path
$nodePath = "C:\Users\P S RAM\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
$firebaseCli = "C:\Users\P S RAM\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

function Run-Firebase {
    param([Parameter(ValueFromRemainingArguments=$true)]$params)
    if (Test-Path $nodePath) {
        & $nodePath $firebaseCli @params
    } else {
        firebase @params
    }
}

Write-Host "`n1. Setting active Firebase Project..."
Run-Firebase use pocketsmartai-app

Write-Host "`n2. Deploying to Firebase Hosting..."
Run-Firebase deploy --only hosting

Write-Host "`n[+] Firebase setup completed!"
Write-Host "Firebase Console: https://console.firebase.google.com/project/pocketsmartai-app/overview"
