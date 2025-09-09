# 广告系统配置
# 将此文件复制为 .env.local 并修改为你的配置

# GitHub 仓库配置
VITE_ADS_GITHUB_USER=your-github-username
VITE_ADS_GITHUB_REPO=es-manager-ads
VITE_ADS_GITHUB_BRANCH=main
VITE_ADS_FILE_PATH=ads.json

# 缓存配置（毫秒）
VITE_ADS_CACHE_EXPIRY=3600000  # 1小时
VITE_ADS_REFRESH_INTERVAL=3600000  # 1小时

# 显示配置
VITE_ADS_MAX_TO_SHOW=2
VITE_ADS_ROTATION_INTERVAL=10000  # 10秒

# 是否启用广告（true/false）
VITE_ADS_ENABLED=true