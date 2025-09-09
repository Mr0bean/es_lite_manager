# 广告配置说明

## 概述
这个目录包含 ES Manager 的广告配置文件，用于展示社区推荐和友情链接。

## 配置文件结构

### ads.json
主配置文件，包含所有广告内容和设置。

#### 字段说明

**顶层字段：**
- `version`: 配置版本号
- `lastUpdated`: 最后更新时间
- `enabled`: 是否启用广告功能
- `ads`: 广告列表数组
- `settings`: 全局设置

**广告对象字段：**
- `id`: 唯一标识符
- `type`: 广告类型 (banner/text/card)
- `title`: 标题
- `description`: 描述
- `link`: 链接地址
- `image`: 图片URL（仅 banner 类型）
- `priority`: 优先级（数字越小优先级越高）
- `startDate`: 开始日期
- `endDate`: 结束日期
- `target`: 链接打开方式 (_blank/_self)
- `style`: 自定义样式

**设置字段：**
- `refreshInterval`: 刷新间隔（毫秒）
- `maxAdsToShow`: 最多显示广告数
- `position`: 显示位置 (sidebar/bottom/popup)
- `animation`: 是否启用动画
- `rotationInterval`: 轮播间隔（毫秒）

## 如何更新广告

### 方法一：直接在 GitHub 上编辑
1. 在 GitHub 仓库中找到 `ads-config/ads.json`
2. 点击编辑按钮
3. 修改内容
4. 提交更改

### 方法二：本地修改后推送
```bash
# 1. 克隆仓库
git clone [your-repo-url]

# 2. 修改 ads.json
vim ads-config/ads.json

# 3. 提交并推送
git add ads-config/ads.json
git commit -m "Update ads configuration"
git push
```

## 广告类型示例

### Banner 广告
```json
{
  "type": "banner",
  "title": "社区活动",
  "image": "https://example.com/banner.jpg",
  "link": "https://example.com/event"
}
```

### 文本广告
```json
{
  "type": "text",
  "title": "推荐阅读",
  "description": "最新技术文章",
  "link": "https://blog.example.com"
}
```

### 卡片广告
```json
{
  "type": "card",
  "title": "友情链接",
  "items": [
    {
      "name": "技术论坛",
      "description": "交流技术问题",
      "link": "https://forum.example.com"
    }
  ]
}
```

## 注意事项
1. 修改后约 1 小时内生效（取决于 refreshInterval 设置）
2. 图片建议使用 CDN 链接
3. 确保 JSON 格式正确
4. 建议定期清理过期广告