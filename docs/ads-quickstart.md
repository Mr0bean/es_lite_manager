# 广告系统快速开始指南

## 🚀 5分钟快速配置

### 步骤 1: 创建 GitHub 仓库

1. 登录 GitHub，创建新仓库
2. 仓库名称：`es-manager-ads`（或自定义名称）
3. 设置为 **Public** 公开仓库

### 步骤 2: 创建广告配置文件

在新仓库中创建 `ads.json` 文件，复制以下内容：

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-09T00:00:00Z",
  "enabled": true,
  "ads": [
    {
      "id": "welcome",
      "type": "text",
      "title": "欢迎使用 ES Manager",
      "description": "这是您的第一个广告位，点击编辑 ads.json 来更新内容",
      "link": "https://github.com/YOUR_USERNAME/es-manager-ads",
      "priority": 1
    }
  ],
  "settings": {
    "refreshInterval": 3600000,
    "maxAdsToShow": 2,
    "position": "sidebar",
    "animation": true,
    "rotationInterval": 10000
  }
}
```

### 步骤 3: 配置 ES Manager

1. 复制环境变量配置文件：
```bash
cp .env.ads .env.local
```

2. 编辑 `.env.local`，更新为你的 GitHub 信息：
```env
VITE_ADS_GITHUB_USER=YOUR_GITHUB_USERNAME
VITE_ADS_GITHUB_REPO=es-manager-ads
VITE_ADS_ENABLED=true
```

### 步骤 4: 重启应用

```bash
npm run dev
```

✅ **完成！** 广告系统已启用，你应该能在侧边栏看到广告展示。

## 📝 常用广告模板

### 社区推荐
```json
{
  "id": "community-recommend",
  "type": "banner",
  "title": "加入技术社区",
  "description": "与开发者一起学习交流",
  "image": "https://via.placeholder.com/300x100/409EFF/ffffff?text=Community",
  "link": "https://community.example.com",
  "priority": 1
}
```

### 工具推荐
```json
{
  "id": "tools",
  "type": "card",
  "title": "推荐工具",
  "items": [
    {
      "name": "VS Code",
      "description": "强大的代码编辑器",
      "link": "https://code.visualstudio.com",
      "icon": "💻"
    },
    {
      "name": "Postman",
      "description": "API 测试工具",
      "link": "https://www.postman.com",
      "icon": "🚀"
    }
  ],
  "priority": 2
}
```

### 文档链接
```json
{
  "id": "docs",
  "type": "text",
  "title": "📚 查看文档",
  "description": "了解更多功能和使用技巧",
  "link": "https://docs.example.com",
  "priority": 3
}
```

## 🔧 快速命令

### 更新广告（GitHub 网页）
1. 访问: `https://github.com/YOUR_USERNAME/es-manager-ads`
2. 点击 `ads.json`
3. 点击编辑按钮 ✏️
4. 修改内容
5. 提交更改

### 强制刷新广告
在浏览器控制台执行：
```javascript
// 清除缓存并刷新
localStorage.removeItem('es_manager_ads_cache');
location.reload();
```

### 临时禁用广告
修改 `.env.local`：
```env
VITE_ADS_ENABLED=false
```

## ❓ 常见问题

### Q: 广告不显示？
**A:** 检查以下项目：
1. GitHub 仓库是否公开
2. `ads.json` 文件路径是否正确
3. `.env.local` 配置是否正确
4. 浏览器控制台是否有错误

### Q: 如何隐藏广告标题？
**A:** 在组件中设置 `:show-header="false"`

### Q: 更新后没有立即生效？
**A:** 默认缓存 1 小时，可以：
- 点击刷新按钮强制更新
- 清除浏览器缓存
- 修改 `VITE_ADS_CACHE_EXPIRY` 减少缓存时间

### Q: 如何添加图片广告？
**A:** 使用 banner 类型并提供图片 URL：
```json
{
  "type": "banner",
  "image": "https://your-image-url.jpg"
}
```

## 📊 查看点击统计

在浏览器控制台运行：
```javascript
// 查看所有点击记录
const clicks = JSON.parse(localStorage.getItem('es_manager_ad_clicks') || '[]');
console.table(clicks);

// 统计各广告点击次数
const stats = clicks.reduce((acc, click) => {
  acc[click.adId] = (acc[click.adId] || 0) + 1;
  return acc;
}, {});
console.table(stats);
```

## 🎨 自定义样式

在广告配置中添加 `style` 字段：
```json
{
  "id": "custom-style",
  "type": "text",
  "title": "特别推荐",
  "style": {
    "backgroundColor": "#fff3cd",
    "borderColor": "#ffc107",
    "color": "#856404"
  }
}
```

## 🚦 下一步

- 📖 查看[完整文档](./ads-implementation.md)
- 🎯 探索更多[广告类型](./ads-implementation.md#广告类型说明)
- ⚙️ 了解[高级配置](./ads-implementation.md#高级功能)
- 💡 获取[最佳实践](./ads-implementation.md#最佳实践)

---

需要帮助？在 [GitHub Issues](https://github.com/YOUR_REPO/issues) 提问！