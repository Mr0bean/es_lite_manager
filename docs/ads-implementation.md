# ES Manager 广告系统实现文档

## 概述
ES Manager 集成了一个基于 GitHub 的广告管理系统，支持在线更新广告内容，主要用于社区推广和友情链接展示。

## 系统架构

### 组件结构
```
├── src/api/ads.js              # 广告数据获取服务
├── src/components/AdsDisplay.vue  # 广告展示组件
├── ads-config/                 # 本地广告配置（fallback）
│   ├── ads.json               # 广告配置文件
│   └── README.md              # 配置说明
└── docs/ads-implementation.md  # 本文档
```

### 工作流程
1. **数据获取**：优先从 GitHub 获取最新广告配置
2. **缓存机制**：本地缓存数据，减少网络请求
3. **回退策略**：GitHub 不可用时使用本地配置
4. **动态更新**：定期刷新，无需重新部署

## 配置指南

### 1. 设置 GitHub 仓库

#### 创建广告配置仓库
1. 在 GitHub 创建新仓库（如：`es-manager-ads`）
2. 创建 `ads.json` 文件
3. 设置仓库为公开（或配置访问令牌）

#### 配置文件结构
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-09T00:00:00Z",
  "enabled": true,
  "ads": [/* 广告列表 */],
  "settings": {/* 全局设置 */}
}
```

### 2. 更新服务配置

在 `src/api/ads.js` 中修改配置：

```javascript
constructor() {
  this.config = {
    githubUser: 'your-github-username',  // 你的 GitHub 用户名
    githubRepo: 'es-manager-ads',        // 仓库名称
    branch: 'main',                      // 分支名
    filePath: 'ads.json',                // 文件路径
    // ...其他配置
  }
}
```

### 3. 广告类型说明

#### Banner 广告
带图片的横幅广告，适合品牌推广：
```json
{
  "type": "banner",
  "title": "社区活动",
  "description": "加入我们的开发者社区",
  "image": "https://example.com/banner.jpg",
  "link": "https://community.example.com"
}
```

#### 文本广告
纯文本广告，适合简单推荐：
```json
{
  "type": "text",
  "title": "技术博客",
  "description": "分享最新的技术文章和教程",
  "link": "https://blog.example.com"
}
```

#### 卡片广告
多项目卡片，适合工具推荐：
```json
{
  "type": "card",
  "title": "推荐工具",
  "items": [
    {
      "name": "工具名称",
      "description": "工具描述",
      "link": "https://tool.example.com",
      "icon": "🔧"
    }
  ]
}
```

## 使用说明

### 组件集成
在需要展示广告的位置引入组件：

```vue
<template>
  <AdsDisplay 
    position="sidebar"     <!-- 位置：sidebar/bottom/popup -->
    :show-header="true"    <!-- 显示标题 -->
    :show-refresh="true"   <!-- 显示刷新按钮 -->
    :auto-rotate="true"    <!-- 自动轮播 -->
  />
</template>

<script>
import AdsDisplay from '@/components/AdsDisplay.vue'
</script>
```

### 位置选项
- `sidebar`: 侧边栏展示（单个广告）
- `bottom`: 底部固定展示（多个广告）
- `popup`: 弹窗展示（居中显示）

## 更新广告内容

### 方法一：GitHub 网页编辑
1. 访问 GitHub 仓库
2. 编辑 `ads.json` 文件
3. 提交更改
4. 等待缓存刷新（默认 1 小时）

### 方法二：Git 命令行
```bash
# 克隆仓库
git clone https://github.com/your-username/es-manager-ads.git

# 编辑配置
vim ads.json

# 提交推送
git add ads.json
git commit -m "Update ads"
git push
```

### 方法三：API 更新（高级）
使用 GitHub API 直接更新文件：
```javascript
// 示例：使用 GitHub API 更新广告
const updateAds = async (newAds) => {
  const response = await fetch(
    'https://api.github.com/repos/USER/REPO/contents/ads.json',
    {
      method: 'PUT',
      headers: {
        'Authorization': 'token YOUR_GITHUB_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update ads',
        content: btoa(JSON.stringify(newAds)),
        sha: 'CURRENT_FILE_SHA'
      })
    }
  )
  return response.json()
}
```

## 高级功能

### 1. 广告调度
通过设置开始和结束日期控制广告展示时间：
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### 2. 优先级控制
使用 `priority` 字段控制展示顺序（数字越小优先级越高）：
```json
{
  "priority": 1
}
```

### 3. 样式自定义
为特定广告添加自定义样式：
```json
{
  "style": {
    "backgroundColor": "#f0f2f5",
    "borderColor": "#1890ff"
  }
}
```

### 4. 点击追踪
系统自动记录广告点击数据到 localStorage：
```javascript
// 获取点击统计
const clicks = JSON.parse(
  localStorage.getItem('es_manager_ad_clicks') || '[]'
)
```

## 缓存管理

### 缓存策略
- **默认缓存时间**：1 小时
- **存储位置**：localStorage
- **缓存键名**：`es_manager_ads_cache`

### 手动清除缓存
```javascript
// 在浏览器控制台执行
localStorage.removeItem('es_manager_ads_cache')
```

### 强制刷新
点击广告组件的刷新按钮或调用：
```javascript
import adsService from '@/api/ads'
adsService.getAds(true) // 强制刷新
```

## 故障排除

### 广告不显示
1. 检查 `enabled` 字段是否为 `true`
2. 验证日期范围是否有效
3. 确认 GitHub 仓库可访问
4. 查看浏览器控制台错误

### GitHub 连接失败
1. 验证仓库地址和文件路径
2. 确认仓库为公开或配置了访问令牌
3. 检查网络连接
4. 系统会自动使用本地配置作为回退

### 缓存问题
1. 清除浏览器缓存
2. 删除 localStorage 数据
3. 强制刷新页面

## 安全考虑

### 内容安全
- 仅从可信的 GitHub 仓库加载内容
- 使用 HTTPS 协议传输数据
- 验证 JSON 格式防止注入

### 隐私保护
- 点击数据仅存储在本地
- 不收集用户个人信息
- 不使用第三方追踪

## 最佳实践

### 1. 广告内容
- 保持内容相关性和价值
- 避免过度商业化
- 定期更新保持新鲜感

### 2. 性能优化
- 使用 CDN 托管图片
- 控制广告数量（建议 ≤3 个）
- 合理设置刷新间隔

### 3. 用户体验
- 提供关闭/隐藏选项
- 避免干扰主要功能
- 保持视觉一致性

## 未来计划

### 计划功能
- [ ] A/B 测试支持
- [ ] 更丰富的广告模板
- [ ] 广告效果分析仪表板
- [ ] 多语言广告支持
- [ ] 广告管理后台界面

### 优化方向
- 支持更多广告位置
- 增强缓存策略
- 改进加载性能
- 添加动画效果

## 联系支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [你的项目地址]/issues
- Email: your-email@example.com

## 更新日志

### v1.0.0 (2025-01-09)
- 初始版本发布
- 支持三种广告类型
- GitHub 在线更新功能
- 本地缓存机制
- 自动轮播展示