#!/bin/sh

# Không cần export venv paths nữa vì Python packages đã cài trực tiếp vào system

print_banner() {
    echo "----------------------------------------"
    echo "n8n Puppeteer Node - Environment Details"
    echo "----------------------------------------"
    echo "Node.js version: $(node -v)"
    echo "n8n version: $(n8n --version)"

    # Get Chromium version specifically from the path we're using for Puppeteer
    CHROME_VERSION=$("$PUPPETEER_EXECUTABLE_PATH" --version 2>/dev/null || echo "Chromium not found")
    echo "Chromium version: $CHROME_VERSION"

    # Get Puppeteer version if installed
    PUPPETEER_PATH="/opt/n8n-custom-nodes/node_modules/n8n-nodes-puppeteer"
    if [ -f "$PUPPETEER_PATH/package.json" ]; then
        PUPPETEER_VERSION=$(node -p "require('$PUPPETEER_PATH/package.json').version")
        echo "n8n-nodes-puppeteer version: $PUPPETEER_VERSION"

        # Try to resolve puppeteer package from the n8n-nodes-puppeteer directory
        CORE_PUPPETEER_VERSION=$(cd "$PUPPETEER_PATH" && node -e "try { const version = require('puppeteer/package.json').version; console.log(version); } catch(e) { console.log('not found'); }")
        echo "Puppeteer core version: $CORE_PUPPETEER_VERSION"
    else
        echo "n8n-nodes-puppeteer: not installed"
    fi

    echo "Puppeteer executable path: $PUPPETEER_EXECUTABLE_PATH"
    echo "N8N_CUSTOM_EXTENSIONS: $N8N_CUSTOM_EXTENSIONS"
    echo "NODE_PATH: $NODE_PATH"
    echo "----------------------------------------"
}

# Add custom nodes to the NODE_PATH
if [ -n "$N8N_CUSTOM_EXTENSIONS" ]; then
    export N8N_CUSTOM_EXTENSIONS="/opt/n8n-custom-nodes:${N8N_CUSTOM_EXTENSIONS}"
else
    export N8N_CUSTOM_EXTENSIONS="/opt/n8n-custom-nodes"
fi

# Link custom packages to .n8n directory for Code node access
if [ ! -L "/home/node/.n8n/node_modules" ]; then
    ln -sf /opt/custom-packages/node_modules /home/node/.n8n/node_modules
    echo "Linked /opt/custom-packages/node_modules to /home/node/.n8n/node_modules"
fi

# Patch node-pandoc to ignore warnings (they are written to stderr)
# The library incorrectly treats all stderr output as fatal errors
patch_pandoc() {
    PANDOC_LIB="/home/node/.n8n/nodes/node_modules/@couleetech/n8n-nodes-pandoc/node_modules/node-pandoc/index.js"
    if [ -f "$PANDOC_LIB" ]; then
        # Check if already patched
        if ! grep -q "PATCHED: Ignore warnings" "$PANDOC_LIB" 2>/dev/null; then
            # Create patched version that ignores warnings
            cat > /tmp/pandoc_patch.js << 'PATCH_EOF'
// PATCHED: Ignore warnings - original onStdErrData treated all stderr as errors
onStdErrData = function (err) {
    var errStr = err.toString();
    // Ignore pandoc warnings (start with [WARNING])
    if (errStr.indexOf('[WARNING]') === 0 || errStr.indexOf('[W') === 0) {
        console.log('Pandoc warning (ignored):', errStr.substring(0, 100));
        return;
    }
    callback(new Error(errStr));
};
PATCH_EOF
            # Apply patch using sed
            sed -i 's/onStdErrData = function (err) {/onStdErrData = function (err) {\n    \/\/ PATCHED: Ignore warnings\n    var errStr = err.toString();\n    if (errStr.indexOf("[WARNING]") === 0 || errStr.indexOf("[W") === 0) { return; }/' "$PANDOC_LIB" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "Patched node-pandoc to ignore warnings"
            fi
        fi
    fi
}

# Run patch
patch_pandoc

print_banner

# Execute the original n8n entrypoint script
exec /docker-entrypoint.sh "$@"