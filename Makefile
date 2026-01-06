.PHONY: help dev dev-web dev-backend dev-backend-hot build build-web build-backend test clean install docker-build docker-up docker-down docker-logs backend-swag backend-migrate

# 默认目标
help:
	@echo "Available commands:"
	@echo "  make dev              - Start all services (web + backend)"
	@echo "  make dev-web          - Start web frontend only"
	@echo "  make dev-backend      - Start Go backend only"
	@echo "  make dev-backend-hot  - Start Go backend with hot reload (Air)"
	@echo "  make build            - Build all projects"
	@echo "  make build-web        - Build web frontend only"
	@echo "  make build-backend    - Build Go backend only"
	@echo "  make test             - Run all tests"
	@echo "  make test-backend     - Run Go backend tests"
	@echo "  make clean            - Clean all build artifacts"
	@echo "  make install          - Install all dependencies"

# 开发
dev:
	@echo "Starting all services..."
	@pnpm dev

dev-web:
	@echo "Starting web frontend..."
	@pnpm dev:web

dev-backend:
	@echo "Starting Go backend..."
	@cd apps/backend && go run cmd/server/main.go

dev-backend-hot:
	@echo "Starting Go backend with hot reload (Air)..."
	@cd apps/backend && air

# 构建
build: build-web build-backend
	@echo "All projects built successfully!"

build-web:
	@echo "Building web frontend..."
	@pnpm build:web

build-backend:
	@echo "Building Go backend..."
	@cd apps/backend && mkdir -p dist && go build -o ./dist/backend ./cmd/server

# 测试
test:
	@echo "Running all tests..."
	@pnpm test
	@make test-backend

test-backend:
	@echo "Running Go backend tests..."
	@cd apps/backend && go test -v ./...

# 清理
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf apps/backend/dist
	@rm -rf apps/backend/tmp
	@rm -rf apps/web/dist
	@rm -rf apps/web/node_modules
	@rm -rf node_modules
	@rm -f apps/backend/build-errors.log
	@echo "Clean complete!"

# 安装依赖
install:
	@echo "Installing dependencies..."
	@pnpm install
	@cd apps/backend && go mod download
	@echo "Dependencies installed!"

# Go 后端特定命令
backend-swag:
	@echo "Generating Swagger docs..."
	@cd apps/backend && swag init -g cmd/server/main.go

backend-migrate:
	@echo "Running database migrations..."
	@cd apps/backend && go run cmd/migrate/main.go

# Docker 命令
docker-build:
	@echo "Building Docker images..."
	@docker-compose -f docker/docker-compose.yml build

docker-up:
	@echo "Starting Docker containers..."
	@docker-compose -f docker/docker-compose.yml up -d

docker-down:
	@echo "Stopping Docker containers..."
	@docker-compose -f docker/docker-compose.yml down

docker-logs:
	@docker-compose -f docker/docker-compose.yml logs -f
