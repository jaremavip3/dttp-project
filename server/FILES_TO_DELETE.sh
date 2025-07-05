#!/bin/bash
# Run this script from the server directory to remove unused files after migration to dttp-ai-server-multimodel

rm -f .env.dfn5b .env.minimal .env.minimal-working .env.prod .env.production .env.test .env.example
rm -f docker-compose.dfn5b.yml docker-compose.minimal.yml docker-compose.prod.yml
rm -f models/dfn5b_model.py
rm -f deploy-prod.sh deploy.sh fix-port-conflict.sh setup-local.sh setup.sh verify-deployment.sh

echo "Cleanup complete. Only dttp-ai-server-multimodel and required files remain."
