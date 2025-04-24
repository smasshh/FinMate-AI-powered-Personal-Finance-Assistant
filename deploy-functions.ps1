# Change to project directory
cd C:\Users\harsh\OneDrive\Desktop\FinMate

# Read and set environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -and !$_.StartsWith("#")) {
        $key, $value = $_ -split '=', 2
        Write-Host "Setting environment variable: $key"
        npx supabase secrets set $key="$value"
    }
}

# Deploy the function
Write-Host "Deploying trade-assistant function..."
npx supabase functions deploy trade-assistant

Write-Host "Done!" 