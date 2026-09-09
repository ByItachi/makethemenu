@echo off
set HTTP_PROXY=
set HTTPS_PROXY=
curl.exe -k -H "Host: upload.wikimedia.org" https://198.35.26.96/wikipedia/commons/2/2c/World_map_blank_gmt.svg -o client/public/world-map.svg
if %ERRORLEVEL% EQU 0 (
    echo Download success
) else (
    echo Download failed with error %ERRORLEVEL%
)
