#!/bin/bash

# ============================================
# AI Insurance Underwriting Agent - Startup
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║    AI Insurance Underwriting Agent Platform      ║"
echo "║         Starting Application...                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found!${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3001}

# ---- Clean up used ports ----
echo -e "\n${YELLOW}Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  echo -e "  ${GREEN}✓ Port $port is free${NC}"
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ---- Install dependencies ----
echo -e "\n${YELLOW}Installing dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
  echo -e "  Installing backend dependencies..."
  cd backend && npm install && cd ..
  echo -e "  ${GREEN}✓ Backend dependencies installed${NC}"
else
  echo -e "  ${GREEN}✓ Backend dependencies already installed${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
  echo -e "  Installing frontend dependencies..."
  cd frontend && npm install && cd ..
  echo -e "  ${GREEN}✓ Frontend dependencies installed${NC}"
else
  echo -e "  ${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# ---- Setup PostgreSQL database ----
echo -e "\n${YELLOW}Setting up database...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -q 2>/dev/null; then
  echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
  if command -v brew &>/dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi
  sleep 2
fi

# Create database if it doesn't exist
DB_NAME=${DB_NAME:-insurance_underwriting}
DB_USER=${DB_USER:-postgres}

if psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${GREEN}✓ Database '$DB_NAME' exists${NC}"
else
  echo -e "  Creating database '$DB_NAME'..."
  createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U "$DB_USER" "$DB_NAME" 2>/dev/null || \
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}✓ Database created${NC}"
fi

# ---- Seed database ----
echo -e "\n${YELLOW}Seeding database...${NC}"
cd backend && node seed.js && cd ..
echo -e "${GREEN}✓ Database seeded successfully${NC}"

# ---- Start services with hot reload ----
echo -e "\n${BLUE}Starting services with hot reload...${NC}"

# Start backend with nodemon (watches for changes)
echo -e "  Starting backend on port $BACKEND_PORT..."
( cd "$SCRIPT_DIR/backend" && npx nodemon server.js ) &
BACKEND_PID=$!

sleep 2

# Start frontend with Vite (HMR built-in)
echo -e "  Starting frontend on port $FRONTEND_PORT..."
( cd "$SCRIPT_DIR/frontend" && npx vite --port $FRONTEND_PORT ) &
FRONTEND_PID=$!

# Trap to clean up on exit
trap "echo -e '\n${YELLOW}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo -e "\n${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Application Started Successfully!        ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:  http://localhost:${FRONTEND_PORT}                 ║${NC}"
echo -e "${GREEN}║  Backend:   http://localhost:${BACKEND_PORT}                 ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Login: admin@insuranceai.com / admin123         ║${NC}"
echo -e "${GREEN}║  Hot reload enabled for both services            ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"

# Wait for background processes
wait
