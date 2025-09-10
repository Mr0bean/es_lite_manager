// GitHub Issue 助手 - 帮助用户快速创建结构化的issue
import { GITHUB_CONFIG, openInBrowser } from '../config/github'

/**
 * Issue类型配置
 */
export const ISSUE_TYPES = {
  BUG: {
    value: 'bug',
    label: 'Bug Report',
    title: '🐛 Bug: ',
    template: 'bug_report',
    labels: ['bug'],
    color: 'danger'
  },
  FEATURE: {
    value: 'feature',
    label: 'Feature Request',
    title: '✨ Feature: ',
    template: 'feature_request',
    labels: ['enhancement'],
    color: 'success'
  },
  IMPROVEMENT: {
    value: 'improvement',
    label: 'Improvement',
    title: '💡 Improvement: ',
    template: 'improvement',
    labels: ['enhancement'],
    color: 'primary'
  },
  QUESTION: {
    value: 'question',
    label: 'Question',
    title: '❓ Question: ',
    template: 'question',
    labels: ['question'],
    color: 'info'
  },
  DOCUMENTATION: {
    value: 'documentation',
    label: 'Documentation',
    title: '📚 Docs: ',
    template: 'documentation',
    labels: ['documentation'],
    color: 'warning'
  }
}

/**
 * 获取系统信息
 */
export function getSystemInfo() {
  const info = {
    // 浏览器信息
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    
    // 应用信息
    appVersion: '1.0.0', // 从package.json获取
    currentUrl: window.location.href,
    timestamp: new Date().toISOString(),
    
    // 环境信息
    environment: process.env.NODE_ENV || 'production',
    isElectron: !!(window && window.process && window.process.type),
  }
  
  // 浏览器版本检测
  const browserInfo = detectBrowser()
  info.browser = browserInfo.name
  info.browserVersion = browserInfo.version
  
  // 操作系统检测
  info.os = detectOS()
  
  return info
}

/**
 * 检测浏览器类型和版本
 */
function detectBrowser() {
  const ua = navigator.userAgent
  let name = 'Unknown'
  let version = 'Unknown'
  
  if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox'
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown'
  } else if (ua.indexOf('Chrome') > -1) {
    name = 'Chrome'
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown'
  } else if (ua.indexOf('Safari') > -1) {
    name = 'Safari'
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown'
  } else if (ua.indexOf('Edge') > -1) {
    name = 'Edge'
    version = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown'
  }
  
  return { name, version }
}

/**
 * 检测操作系统
 */
function detectOS() {
  const platform = navigator.platform
  const ua = navigator.userAgent
  
  if (platform.indexOf('Win') > -1) return 'Windows'
  if (platform.indexOf('Mac') > -1) return 'macOS'
  if (platform.indexOf('Linux') > -1) return 'Linux'
  if (/Android/.test(ua)) return 'Android'
  if (/iOS|iPhone|iPad|iPod/.test(ua)) return 'iOS'
  
  return 'Unknown'
}

/**
 * 生成Bug报告模板
 */
export function generateBugTemplate(data = {}) {
  const systemInfo = getSystemInfo()
  
  return `## Bug Description
${data.description || '[Please describe the bug in detail]'}

## Steps to Reproduce
1. ${data.steps?.[0] || '[First step]'}
2. ${data.steps?.[1] || '[Second step]'}
3. ${data.steps?.[2] || '[Third step]'}

## Expected Behavior
${data.expected || '[What you expected to happen]'}

## Actual Behavior
${data.actual || '[What actually happened]'}

## Screenshots
${data.screenshots ? '![Screenshot](' + data.screenshots + ')' : '[If applicable, add screenshots to help explain your problem]'}

## System Information
\`\`\`
- OS: ${systemInfo.os}
- Browser: ${systemInfo.browser} ${systemInfo.browserVersion}
- App Version: ${systemInfo.appVersion}
- Screen Resolution: ${systemInfo.screenResolution}
- Language: ${systemInfo.language}
- Environment: ${systemInfo.environment}
- Electron: ${systemInfo.isElectron ? 'Yes' : 'No'}
\`\`\`

## Additional Context
${data.context || '[Add any other context about the problem here]'}

## Error Logs
${data.errorLog ? '```\n' + data.errorLog + '\n```' : '[If there are any error messages in the console, paste them here]'}
`
}

/**
 * 生成功能请求模板
 */
export function generateFeatureTemplate(data = {}) {
  return `## Feature Description
${data.description || '[Please describe the feature you would like to see]'}

## Problem Statement
${data.problem || '[What problem does this feature solve?]'}

## Proposed Solution
${data.solution || '[How do you think this should work?]'}

## Alternatives Considered
${data.alternatives || '[Have you considered any alternative solutions?]'}

## Use Cases
${data.useCases?.map((uc, i) => `${i + 1}. ${uc}`).join('\n') || '1. [Primary use case]\n2. [Secondary use case]'}

## Additional Context
${data.context || '[Add any other context, mockups, or examples about the feature request here]'}

## Priority
${data.priority || '- [ ] Critical\n- [x] Nice to have\n- [ ] Low priority'}
`
}

/**
 * 生成改进建议模板
 */
export function generateImprovementTemplate(data = {}) {
  return `## Current Situation
${data.current || '[Describe the current functionality or behavior]'}

## Suggested Improvement
${data.suggestion || '[Describe your improvement suggestion]'}

## Benefits
${data.benefits?.map((b, i) => `${i + 1}. ${b}`).join('\n') || '1. [Primary benefit]\n2. [Additional benefit]'}

## Implementation Ideas
${data.implementation || '[If you have ideas on how this could be implemented, share them here]'}

## Additional Context
${data.context || '[Add any other context or examples]'}
`
}

/**
 * 生成问题模板
 */
export function generateQuestionTemplate(data = {}) {
  return `## Question
${data.question || '[Your question here]'}

## Context
${data.context || '[Provide context about why you are asking this question]'}

## What I've Tried
${data.tried || '[List what you have already tried or researched]'}

## Related Documentation
${data.docs || '[Link to any related documentation you have consulted]'}

## System Information
- App Version: ${getSystemInfo().appVersion}
- Environment: ${getSystemInfo().environment}
`
}

/**
 * 构建GitHub Issue URL
 */
export function buildGitHubIssueUrl(options = {}) {
  const {
    owner = GITHUB_CONFIG.owner,
    repo = GITHUB_CONFIG.repo,
    title = '',
    body = '',
    labels = [],
    assignee = '',
    milestone = '',
    template = '',
    projects = []
  } = options
  
  const params = new URLSearchParams()
  
  if (title) params.append('title', title)
  if (body) params.append('body', body)
  if (labels.length > 0) params.append('labels', labels.join(','))
  if (assignee) params.append('assignee', assignee)
  if (milestone) params.append('milestone', milestone)
  if (template) params.append('template', template)
  if (projects.length > 0) params.append('projects', projects.join(','))
  
  return `https://github.com/${owner}/${repo}/issues/new?${params.toString()}`
}

/**
 * 收集错误信息
 */
export function collectErrorInfo(error) {
  if (!error) return null
  
  return {
    message: error.message || 'Unknown error',
    stack: error.stack || 'No stack trace available',
    name: error.name || 'Error',
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }
}

/**
 * 生成错误报告
 */
export function generateErrorReport(error, context = {}) {
  const errorInfo = collectErrorInfo(error)
  const systemInfo = getSystemInfo()
  
  return `## Error Report

### Error Details
\`\`\`
Name: ${errorInfo.name}
Message: ${errorInfo.message}
Timestamp: ${errorInfo.timestamp}
URL: ${errorInfo.url}
\`\`\`

### Stack Trace
\`\`\`
${errorInfo.stack}
\`\`\`

### Context
${context.description || 'No additional context provided'}

### System Information
\`\`\`json
${JSON.stringify(systemInfo, null, 2)}
\`\`\`

### Steps Before Error
${context.steps ? context.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'Not provided'}

### Additional Information
${context.additional || 'None'}
`
}

/**
 * 快速创建Issue
 */
export function quickCreateIssue(type, data = {}) {
  let template = ''
  let title = ''
  let labels = []
  
  const issueType = ISSUE_TYPES[type.toUpperCase()] || ISSUE_TYPES.BUG
  
  switch (issueType.value) {
    case 'bug':
      template = generateBugTemplate(data)
      title = issueType.title + (data.title || 'Untitled Bug')
      labels = issueType.labels
      break
    case 'feature':
      template = generateFeatureTemplate(data)
      title = issueType.title + (data.title || 'Untitled Feature')
      labels = issueType.labels
      break
    case 'improvement':
      template = generateImprovementTemplate(data)
      title = issueType.title + (data.title || 'Untitled Improvement')
      labels = issueType.labels
      break
    case 'question':
      template = generateQuestionTemplate(data)
      title = issueType.title + (data.title || 'Untitled Question')
      labels = issueType.labels
      break
    default:
      template = data.body || ''
      title = data.title || 'Untitled Issue'
      labels = data.labels || []
  }
  
  const url = buildGitHubIssueUrl({
    title,
    body: template,
    labels
  })
  
  return { url, title, body: template, labels }
}

/**
 * 打开Issue创建页面
 */
export function openIssueCreator(type, data = {}) {
  const issue = quickCreateIssue(type, data)
  openInBrowser(issue.url)
  return issue
}