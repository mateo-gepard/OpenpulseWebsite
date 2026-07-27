#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
dist_dir="$project_dir/dist"
client_dir="$dist_dir/client"
server_dir="$dist_dir/server"

rm -rf "$dist_dir"
mkdir -p "$client_dir/Photos" "$server_dir" "$dist_dir/.openai"

cp "$project_dir/index.html" "$client_dir/index.html"
cp "$project_dir/hardware.html" "$client_dir/hardware.html"
cp "$project_dir/use-cases.html" "$client_dir/use-cases.html"
cp "$project_dir/software.html" "$client_dir/software.html"
cp "$project_dir/team.html" "$client_dir/team.html"
cp "$project_dir/competitions.html" "$client_dir/competitions.html"
cp "$project_dir/styles.css" "$client_dir/styles.css"
cp "$project_dir/app.js" "$client_dir/app.js"
cp "$project_dir/Photos/openpulse-logo-alpha.png" "$client_dir/Photos/openpulse-logo-alpha.png"
cp "$project_dir/Photos/TeamFoto.PNG" "$client_dir/Photos/TeamFoto.PNG"
cp "$project_dir/Photos/FotoMateo-upright.jpg" "$client_dir/Photos/FotoMateo-upright.jpg"
cp "$project_dir/Photos/FotoJuan.png" "$client_dir/Photos/FotoJuan.png"
cp "$project_dir/Photos/FotoRoman.jpg" "$client_dir/Photos/FotoRoman.jpg"
cp "$project_dir/Photos/jugend-gruendet-stage.jpg" "$client_dir/Photos/jugend-gruendet-stage.jpg"
cp "$project_dir/Photos/openpulse-social-preview.png" "$client_dir/Photos/openpulse-social-preview.png"
cp "$project_dir/Photos/hardware-main-pcb.webp" "$client_dir/Photos/hardware-main-pcb.webp"
cp "$project_dir/Photos/hardware-puck-top.webp" "$client_dir/Photos/hardware-puck-top.webp"
cp "$project_dir/Photos/product-exploded.webp" "$client_dir/Photos/product-exploded.webp"
cp "$project_dir/Photos/product-shell.webp" "$client_dir/Photos/product-shell.webp"
cp "$project_dir/server/index.js" "$server_dir/index.js"
cp "$project_dir/.openai/hosting.json" "$dist_dir/.openai/hosting.json"

echo "OpenPulse static deployment build created in $dist_dir"
