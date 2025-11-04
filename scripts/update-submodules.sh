#!/bin/bash
# Update Git submodules to latest commits and reapply sparse-checkout

set -e

echo "Updating Git submodules..."
git submodule update --remote --recursive

echo ""
echo "Reapplying sparse-checkout to submodules..."
./scripts/setup-submodules-sparse.sh

echo ""
echo "✓ Submodules updated successfully!"
