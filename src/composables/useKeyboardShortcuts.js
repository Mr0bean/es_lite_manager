import { onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 键盘快捷键管理
 */
export function useKeyboardShortcuts(shortcuts = {}) {
  const defaultShortcuts = {
    // Ctrl/Cmd + Shift + F: 打开反馈对话框
    'ctrl+shift+f': () => {
      window.dispatchEvent(new CustomEvent('open-feedback', { detail: { type: 'feature' } }))
    },
    'meta+shift+f': () => {
      window.dispatchEvent(new CustomEvent('open-feedback', { detail: { type: 'feature' } }))
    },
    
    // Ctrl/Cmd + Shift + B: 报告Bug
    'ctrl+shift+b': () => {
      window.dispatchEvent(new CustomEvent('open-feedback', { detail: { type: 'bug' } }))
    },
    'meta+shift+b': () => {
      window.dispatchEvent(new CustomEvent('open-feedback', { detail: { type: 'bug' } }))
    },
    
    // Ctrl/Cmd + Shift + H: 显示帮助
    'ctrl+shift+h': () => {
      showShortcutsHelp()
    },
    'meta+shift+h': () => {
      showShortcutsHelp()
    },
    
    // Ctrl/Cmd + K: 快速搜索
    'ctrl+k': (e) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('open-search'))
    },
    'meta+k': (e) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('open-search'))
    },
    
    // Ctrl/Cmd + /: 切换侧边栏
    'ctrl+/': () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar'))
    },
    'meta+/': () => {
      window.dispatchEvent(new CustomEvent('toggle-sidebar'))
    },
    
    // ESC: 关闭对话框
    'escape': () => {
      window.dispatchEvent(new CustomEvent('close-dialog'))
    },
    
    ...shortcuts
  }
  
  const pressedKeys = new Set()
  
  // 检查快捷键组合
  const checkShortcut = (e) => {
    const key = e.key.toLowerCase()
    const ctrl = e.ctrlKey
    const meta = e.metaKey
    const shift = e.shiftKey
    const alt = e.altKey
    
    // 构建快捷键字符串
    let shortcutStr = ''
    if (ctrl) shortcutStr += 'ctrl+'
    if (meta) shortcutStr += 'meta+'
    if (alt) shortcutStr += 'alt+'
    if (shift) shortcutStr += 'shift+'
    
    // 特殊键处理
    const specialKey = getSpecialKey(key)
    shortcutStr += specialKey
    
    return shortcutStr
  }
  
  // 获取特殊键名称
  const getSpecialKey = (key) => {
    const keyMap = {
      ' ': 'space',
      'enter': 'enter',
      'escape': 'escape',
      'tab': 'tab',
      'delete': 'delete',
      'backspace': 'backspace',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      '/': '/',
      '?': '?',
      '.': '.',
      ',': ','
    }
    
    return keyMap[key] || key
  }
  
  // 处理按键按下
  const handleKeyDown = (e) => {
    // 忽略输入框内的快捷键
    const target = e.target
    const isInput = target.tagName === 'INPUT' || 
                   target.tagName === 'TEXTAREA' || 
                   target.contentEditable === 'true'
    
    // 某些快捷键即使在输入框中也应该工作
    const allowedInInput = ['escape', 'ctrl+enter', 'meta+enter']
    
    const shortcut = checkShortcut(e)
    
    if (!isInput || allowedInInput.includes(shortcut)) {
      if (defaultShortcuts[shortcut]) {
        defaultShortcuts[shortcut](e)
      }
    }
    
    pressedKeys.add(e.key.toLowerCase())
  }
  
  // 处理按键释放
  const handleKeyUp = (e) => {
    pressedKeys.delete(e.key.toLowerCase())
  }
  
  // 显示快捷键帮助
  const showShortcutsHelp = () => {
    const helpText = `
      Keyboard Shortcuts:
      
      📝 Feedback & Support:
      • Ctrl/Cmd + Shift + F: Open Feedback Dialog
      • Ctrl/Cmd + Shift + B: Report a Bug
      
      🔍 Navigation:
      • Ctrl/Cmd + K: Quick Search
      • Ctrl/Cmd + /: Toggle Sidebar
      • ESC: Close Current Dialog
      
      ❓ Help:
      • Ctrl/Cmd + Shift + H: Show This Help
    `.trim()
    
    ElMessage({
      message: helpText,
      type: 'info',
      duration: 10000,
      showClose: true,
      customClass: 'shortcuts-help-message',
      dangerouslyUseHTMLString: true,
      offset: 100
    })
  }
  
  // 注册和清理
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    // 监听清除按键状态（窗口失焦时）
    window.addEventListener('blur', () => {
      pressedKeys.clear()
    })
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    pressedKeys.clear()
  })
  
  return {
    pressedKeys,
    showShortcutsHelp
  }
}

/**
 * 全局快捷键提示组件
 */
export function createShortcutHint(text, keys) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  const formatKey = (key) => {
    const keyMap = {
      'ctrl': isMac ? '⌘' : 'Ctrl',
      'cmd': '⌘',
      'meta': isMac ? '⌘' : 'Win',
      'alt': isMac ? '⌥' : 'Alt',
      'shift': isMac ? '⇧' : 'Shift',
      'enter': '↵',
      'escape': 'Esc',
      'space': 'Space',
      'tab': 'Tab',
      'delete': 'Del',
      'backspace': '⌫',
      'up': '↑',
      'down': '↓',
      'left': '←',
      'right': '→'
    }
    
    return keyMap[key.toLowerCase()] || key.toUpperCase()
  }
  
  const formattedKeys = keys.split('+').map(formatKey).join(isMac ? '' : '+')
  
  return {
    text,
    keys: formattedKeys,
    raw: keys
  }
}