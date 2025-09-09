# 🔍 中文硬编码检查报告

**检查时间**: 2025-09-09
**检查范围**: `src/` 和 `server/` 目录下所有源代码文件

## 📊 统计概览

- **总文件数**: 26个文件包含中文
- **硬编码中文**: 发现大量硬编码中文文本
- **影响范围**: 前端界面、后端日志、注释

## 🚨 严重问题文件

### 1. **src/views/Analyzers.vue** (最严重)
- **行数**: 367-443行
- **问题**: 大量分词器描述硬编码为中文
- **示例**:
  ```javascript
  standard: '标准分词器，使用Unicode文本分割算法，适用于大多数语言',
  chinese: '中文分词器，针对中文文本优化',
  english: '英语分词器，针对英语文本优化，包含词干提取',
  ```
- **影响**: 国际化完全失效

### 2. **server/connectionManager.js**
- **中文内容**:
  - 日志消息: `console.error('加载连接配置失败:', error)`
  - 错误提示: `throw new Error('不能删除当前活跃连接，请先切换到其他连接')`
  - 默认名称: `name: '默认连接'`
- **影响**: 错误信息无法国际化

### 3. **server/index.js**
- **中文内容**:
  - 系统提示: `索引 ${index} 是系统保留索引，禁止删除`
  - 注释: `// 过滤系统索引（以点开头的索引）`
- **影响**: API错误信息无法国际化

### 4. **server/config.js**
- **中文内容**:
  - 日志输出: `console.log('配置加载完成:')`
  - 状态显示: `ES认证: ${esConfig.auth ? '已启用' : '未启用'}`

## 📁 其他受影响文件

### 前端文件
- `src/views/Indices.vue` - 注释和提示文本
- `src/views/Documents.vue` - 界面提示
- `src/views/Search.vue` - 搜索相关文本
- `src/router/index.js` - 注释

### 配置文件
- `server/data/connections.json` - 默认连接名称
- `server/.env.example` - 配置说明注释
- `server/README.md` - 文档（可接受）

## 🔧 修复建议

### 立即修复 (优先级高)

1. **Analyzers.vue 分词器描述**
   - 将所有中文描述移至 i18n 文件
   - 使用 `$t('analyzers.descriptions.xxx')` 引用

2. **服务器错误消息**
   - 创建错误码系统
   - 前端根据错误码显示本地化消息

3. **默认连接名称**
   - 使用配置文件或环境变量
   - 避免硬编码默认值

### 修复示例

```javascript
// 修改前
analyzerDescriptions = {
  standard: '标准分词器，使用Unicode文本分割算法',
  ...
}

// 修改后
analyzerDescriptions = computed(() => ({
  standard: t('analyzers.descriptions.standard'),
  ...
}))
```

## 📝 影响评估

- **用户体验**: 非中文用户看到中文内容，体验极差
- **国际化**: i18n系统部分失效
- **维护性**: 文本散落各处，难以统一管理
- **专业性**: 影响产品国际化形象

## ✅ 行动计划

1. [ ] 提取所有硬编码中文到 i18n 文件
2. [ ] 创建服务端错误码映射表
3. [ ] 统一日志语言为英文
4. [ ] 代码注释统一使用英文
5. [ ] 建立代码审查机制防止新增硬编码

## 🎯 目标

- 完全消除硬编码中文文本
- 支持完整的多语言切换
- 提升代码国际化标准