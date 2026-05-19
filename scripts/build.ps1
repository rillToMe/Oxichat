# scripts/build.ps1
Write-Host "Memulai proses compile Oxichat..." -ForegroundColor Cyan

# 1. Build C# (.NET Native AOT)
Write-Host "`n[1/3] Mengcompile C# Native Extension..." -ForegroundColor Yellow
cd ..\ruin_ext
dotnet publish -r win-x64 -c Release
Copy-Item -Path "bin\Release\net10.0\win-x64\publish\ruin_ext.dll" -Destination "..\ruin_app\" -Force

# 2. Build TypeScript (Bun Standalone)
Write-Host "`n[2/3] Mengcompile TypeScript Plugin..." -ForegroundColor Yellow
cd ..\plugins
bun build ./read_project.ts --compile --outfile read_project_plugin

# 3. Build Rust (Core App)
Write-Host "`n[3/3] Mengcompile Core Rust..." -ForegroundColor Yellow
cd ..\ruin_app
cargo build --release

Write-Host "`nBuild Selesai! Semua binary sudah siap digunakan." -ForegroundColor Green