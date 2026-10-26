#!/bin/bash
# Construit Nidami en fichiers statiques dans ../public/nidami (pour l'héberger sur le site existant).
set -e
cd "$(dirname "$0")"
OUT=../public/nidami; rm -rf $OUT; mkdir -p $OUT
ESB=${ESBUILD:-/opt/npm-tools/node_modules/esbuild/bin/esbuild}
export NODE_PATH=${NODE_PATH:-/home/claude/.npm-global/lib/node_modules}
$ESB src/main.tsx --bundle --minify --outfile=$OUT/app.js --jsx=automatic --define:process.env.NODE_ENV='"production"' --alias:react=${REACT:-/home/claude/.npm-global/lib/node_modules/react} --alias:react-dom=${REACTDOM:-/home/claude/.npm-global/lib/node_modules/react-dom} --loader:.css=css --log-level=warning
cp public/* $OUT/
sed -e 's#<script type="module" src="/src/main.tsx"></script>#<script src="./app.js"></script>#' -e 's#<link rel="icon"#<link rel="stylesheet" href="./app.css" />\n<link rel="icon"#' index.html > $OUT/index.html
echo "Construit dans $OUT"
