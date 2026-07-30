#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
dist_dir="$project_dir/dist"
client_dir="$dist_dir/client"
server_dir="$dist_dir/server"

rm -rf "$dist_dir"
mkdir -p "$client_dir/Photos" "$server_dir" "$dist_dir/.openai"

# single-page site (replaced the multi-page build on 2026-07-30)
cp "$project_dir/index.html" "$client_dir/index.html"
cp -R "$project_dir/css" "$client_dir/css"
cp -R "$project_dir/js" "$client_dir/js"
cp -R "$project_dir/assets" "$client_dir/assets"

# self-contained pages that live outside the main site
cp "$project_dir/dev.html" "$client_dir/dev.html"
cp "$project_dir/test-openpulse.html" "$client_dir/test-openpulse.html"

# dev.html loads its logo from here
cp "$project_dir/Photos/openpulse-logo-alpha.png" "$client_dir/Photos/openpulse-logo-alpha.png"
cp "$project_dir/Photos/openpulse-social-preview.png" "$client_dir/Photos/openpulse-social-preview.png"

cp "$project_dir/server/index.js" "$server_dir/index.js"
cp "$project_dir/.openai/hosting.json" "$dist_dir/.openai/hosting.json"

echo "OpenPulse static deployment build created in $dist_dir"
