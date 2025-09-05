import { createI18n } from 'vue-i18n'
import { 
  languages, 
  defaultLocale, 
  fallbackLocale, 
  getStoredLanguage, 
  detectBrowserLanguage 
} from './languages'

// 动态导入语言包
const messages = {}

// 加载语言包
export async function loadLanguageAsync(lang) {
  // 如果已经加载，直接返回
  if (messages[lang]) {
    return messages[lang]
  }
  
  try {
    // 动态导入语言包
    const module = await import(`./locales/${lang}/index.js`)
    messages[lang] = module.default
    
    // 设置到 i18n
    if (i18n.global) {
      i18n.global.setLocaleMessage(lang, messages[lang])
    }
    
    return messages[lang]
  } catch (error) {
    console.error(`Failed to load language: ${lang}`, error)
    return null
  }
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API
  globalInjection: true, // 全局注入 $t
  locale: getStoredLanguage() || detectBrowserLanguage() || defaultLocale,
  fallbackLocale: fallbackLocale,
  messages: {}, // 初始为空，动态加载
  silentTranslationWarn: true, // 关闭翻译警告（开发时可以打开）
  silentFallbackWarn: true // 关闭回退警告
})

// 初始加载当前语言
const initialLocale = i18n.global.locale.value
loadLanguageAsync(initialLocale).then(() => {
  // 如果是 RTL 语言，设置文档方向
  if (languages[initialLocale]?.rtl) {
    document.documentElement.dir = 'rtl'
  }
})

// 切换语言函数
export async function setI18nLanguage(locale) {
  // 加载语言包
  await loadLanguageAsync(locale)
  
  // 设置语言
  i18n.global.locale.value = locale
  
  // 设置 HTML 标签属性
  document.documentElement.lang = locale
  
  // RTL 支持
  if (languages[locale]?.rtl) {
    document.documentElement.dir = 'rtl'
  } else {
    document.documentElement.dir = 'ltr'
  }
  
  return locale
}

export default i18n