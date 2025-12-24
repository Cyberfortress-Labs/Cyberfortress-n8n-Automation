#!/bin/bash

# --- CẤU HÌNH MÀU SẮC (Cho đẹp trai) ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- HÀM HỖ TRỢ ---

# Hàm lấy Tunnel ID tự động từ file .json trong thư mục cloudflared
get_tunnel_id() {
    TUNNEL_FILE=$(ls cloudflared/*.json 2>/dev/null | head -n 1)
    if [ -n "$TUNNEL_FILE" ]; then
        basename "$TUNNEL_FILE" .json
    else
        echo "Unknown (No JSON file found in ./cloudflared)"
    fi
}

# Hàm hiển thị Banner thông tin
show_banner() {
    local IS_TUNNEL_MODE=$1 # Nhận biến kiểm tra tunnel từ hàm do_up

    # Load biến môi trường từ file .env
    if [ -f .env ]; then
        source .env
    fi
    
    # Xử lý URL và Tunnel ID dựa trên mode
    if [ "$IS_TUNNEL_MODE" = "true" ]; then
        # Logic cũ cho Tunnel
        TUNNEL_ID=$(get_tunnel_id)
        HOST_URL=${TUNNEL_HOST:-${N8N_HOST:-"automation.smartxdr.app"}}
    else
        # Logic mới cho Local/Direct: Ghép từ Subdomain + Domain
        # Fallback về localhost nếu không tìm thấy biến trong env
        if [ -n "$SUBDOMAIN" ] && [ -n "$DOMAIN_NAME" ]; then
            HOST_URL="${SUBDOMAIN}.${DOMAIN_NAME}"
        else
            HOST_URL=${N8N_HOST:-"localhost:5678"}
        fi
    fi

    echo -e "${GREEN}==============================================${NC}"
    echo -e "${GREEN}   CYBERFORTRESS n8n AUTOMATION IS RUNNING    ${NC}"
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${BLUE}Status   :${NC} ${GREEN}Online${NC}"
    echo -e "${BLUE}URL      :${NC} ${YELLOW}https://$HOST_URL${NC}"
    
    # Chỉ in Tunnel ID nếu đang chạy mode tunnel
    if [ "$IS_TUNNEL_MODE" = "true" ]; then
        echo -e "${BLUE}Tunnel ID:${NC} ${YELLOW}$TUNNEL_ID${NC}"
    fi

    echo -e "${GREEN}==============================================${NC}"
    echo -e "Use command: ${YELLOW}./start.sh logs${NC} to view live logs."
    echo ""
}

# --- CÁC CHỨC NĂNG CHÍNH ---

do_up() {
    local USE_TUNNEL=$1
    
    if [ "$USE_TUNNEL" = "true" ]; then
        echo -e "${BLUE}[INFO] Starting services with Cloudflare Tunnel...${NC}"
        COMPOSE_PROFILES=tunnel docker compose up -d
    else
        echo -e "${BLUE}[INFO] Starting services (without tunnel)...${NC}"
        docker compose up -d
    fi
    
    echo -e "${BLUE}[INFO] Waiting for services to initialize (5s)...${NC}"
    sleep 5
    # Truyền biến USE_TUNNEL vào show_banner để nó biết đường in
    show_banner "$USE_TUNNEL"
}

do_down() {
    echo -e "${YELLOW}[WARN] Stopping services...${NC}"
    docker compose --profile tunnel down
    echo -e "${RED}[STOPPED] Services have been shut down.${NC}"
}

do_restart() {
    local USE_TUNNEL=$1
    do_down
    echo ""
    do_up "$USE_TUNNEL"
}

do_logs() {
    echo -e "${BLUE}[INFO] Showing logs (Press Ctrl+C to exit)...${NC}"
    docker compose logs -f
}

do_help() {
    echo -e "${YELLOW}Usage: ./start.sh {up|down|restart|logs} [--tunnel]${NC}"
    echo "  up      : Start the containers (docker compose up -d)"
    echo "  down    : Stop and remove containers (docker compose down)"
    echo "  restart : Restart all containers"
    echo "  logs    : View live logs (docker compose logs -f)"
    echo ""
    echo "Options:"
    echo "  --tunnel : Enable Cloudflare Tunnel (only with 'up' or 'restart')"
    echo ""
    echo "Examples:"
    echo "  ./start.sh up           # Start without tunnel"
    echo "  ./start.sh up --tunnel  # Start with Cloudflare Tunnel"
}

# --- XỬ LÝ THAM SỐ ĐẦU VÀO ---

# Kiểm tra flag --tunnel
USE_TUNNEL="false"
if [[ "$2" == "--tunnel" ]] || [[ "$1" == "--tunnel" && -n "$2" ]]; then
    USE_TUNNEL="true"
fi

case "$1" in
    up)
        do_up "$USE_TUNNEL"
        ;;
    down)
        do_down
        ;;
    restart)
        do_restart "$USE_TUNNEL"
        ;;
    logs)
        do_logs
        ;;
    *)
        do_help
        exit 1
        ;;
esac