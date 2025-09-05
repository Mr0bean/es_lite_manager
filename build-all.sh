#!/bin/bash

# ES Manager 多环境打包脚本
# 用于批量构建不同环境和平台的应用包

echo "=========================================="
echo "ES Manager Multi-Environment Build Script"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数: 打印成功信息
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 函数: 打印错误信息
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 函数: 打印警告信息
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 函数: 构建指定环境和平台
build_env() {
    local env=$1
    local platform=$2
    
    echo ""
    echo "Building $env for $platform..."
    echo "----------------------------------------"
    
    case $platform in
        "mac")
            npm run dist:mac:$env
            ;;
        "win")
            npm run dist:win:$env
            ;;
        "linux")
            npm run dist:linux:$env
            ;;
        "all")
            npm run dist:all:$env
            ;;
        *)
            print_error "Unknown platform: $platform"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Successfully built $env for $platform"
    else
        print_error "Failed to build $env for $platform"
        return 1
    fi
}

# 函数: 清理构建目录
clean_build() {
    echo "Cleaning build directories..."
    rm -rf dist-electron*
    rm -rf dist
    print_success "Build directories cleaned"
}

# 函数: 显示菜单
show_menu() {
    echo ""
    echo "Select build option:"
    echo "1) Build Development"
    echo "2) Build Staging"
    echo "3) Build Production"
    echo "4) Build All Environments"
    echo "5) Clean Build Directories"
    echo "6) Exit"
}

# 函数: 选择平台
select_platform() {
    echo ""
    echo "Select platform:"
    echo "1) macOS"
    echo "2) Windows"
    echo "3) Linux"
    echo "4) All Platforms"
    read -p "Enter choice [1-4]: " platform_choice
    
    case $platform_choice in
        1) echo "mac" ;;
        2) echo "win" ;;
        3) echo "linux" ;;
        4) echo "all" ;;
        *) echo "invalid" ;;
    esac
}

# 主程序
main() {
    while true; do
        show_menu
        read -p "Enter choice [1-6]: " choice
        
        case $choice in
            1)
                platform=$(select_platform)
                if [ "$platform" != "invalid" ]; then
                    build_env "dev" "$platform"
                else
                    print_error "Invalid platform selection"
                fi
                ;;
            2)
                platform=$(select_platform)
                if [ "$platform" != "invalid" ]; then
                    build_env "staging" "$platform"
                else
                    print_error "Invalid platform selection"
                fi
                ;;
            3)
                platform=$(select_platform)
                if [ "$platform" != "invalid" ]; then
                    build_env "prod" "$platform"
                else
                    print_error "Invalid platform selection"
                fi
                ;;
            4)
                platform=$(select_platform)
                if [ "$platform" != "invalid" ]; then
                    echo ""
                    echo "Building all environments for $platform..."
                    build_env "dev" "$platform"
                    build_env "staging" "$platform"
                    build_env "prod" "$platform"
                    echo ""
                    print_success "All environments built successfully!"
                else
                    print_error "Invalid platform selection"
                fi
                ;;
            5)
                clean_build
                ;;
            6)
                echo "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# 检查依赖
echo "Checking dependencies..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm found"

if ! command -v node &> /dev/null; then
    print_error "node is not installed"
    exit 1
fi
print_success "node found"

# 运行主程序
main