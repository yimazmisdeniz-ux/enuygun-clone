#!/bin/bash
# Generate self-signed SSL certificates for development
# Requires openssl
# Run from project root: bash scripts/gen-ssl-certs.sh

mkdir -p ssl

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Bookera/OU=Dev/CN=bookera.local" \
  -addext "subjectAltName=DNS:bookera.local,DNS:localhost,IP:127.0.0.1"

echo "✅ SSL certs generated in ./ssl/"
echo "   cert.pem (public certificate)"
echo "   key.pem (private key)"
echo ""
echo "Next: docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d"