FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Start as root to fix permissions
USER root

# Fix permission issues on mount
RUN mkdir -p /workspace/backend /workspace/frontend && \
    chown -R node:node /workspace

# Optional: Switch back to node (safe default)
USER node
