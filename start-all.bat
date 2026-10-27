@echo off
title LOC II Tank SPA + PocketBase Launcher
echo [1/2] Starting PocketBase in background...
start "PocketBase" pocketbase.exe serve --dir=./pb_data
timeout /t 2 /nobreak >nul
echo [2/2] Starting Vite Dev Server...
start "Vite SPA" npm run dev
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo Both services started!
