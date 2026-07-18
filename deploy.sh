#!/bin/bash
# Deploy PartSeekr to Render
# Usage: ./deploy.sh

echo "Make sure you have:"
echo "  1. A GitHub repo with this project"
echo "  2. A Render account connected to GitHub"
echo "  3. render.yaml in the repo root"
echo ""
echo "Push to GitHub, then create a new Web Service on Render using this repo."
echo "Set STRIPE_RESTRICTED_KEY in Render environment variables."
