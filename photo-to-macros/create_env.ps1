# PowerShell script to create .env file
$envContent = @"
# Google Cloud Vision API credentials
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/GCV_API.json

# OpenAI API Key for Vision analysis
OPENAI_API_KEY=sk-proj-x9Su7NTZL9oxZ79FRTOaD2lS

# Optional: Port settings
PORT=8000
"@

Set-Content -Path .env -Value $envContent
Write-Host "Created .env file successfully."
Get-Content .env 