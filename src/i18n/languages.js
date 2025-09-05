// 支持的语言列表
export const languages = {
  // 东亚语言
  'en': { 
    name: 'English', 
    flag: '🇬🇧', 
    nativeName: 'English',
    shortName: 'EN'
  },
  'zh-CN': { 
    name: '简体中文', 
    flag: '🇨🇳', 
    nativeName: '简体中文',
    shortName: '中'
  },
  'zh-TW': { 
    name: '繁體中文', 
    flag: '🇹🇼', 
    nativeName: '繁體中文',
    shortName: '繁'
  },
  'ja': { 
    name: '日本語', 
    flag: '🇯🇵', 
    nativeName: '日本語',
    shortName: '日'
  },
  'ko': { 
    name: '한국어', 
    flag: '🇰🇷', 
    nativeName: '한국어',
    shortName: '한'
  },
  
  // 欧洲语言
  'es': { 
    name: 'Español', 
    flag: '🇪🇸', 
    nativeName: 'Español',
    shortName: 'ES'
  },
  'fr': { 
    name: 'Français', 
    flag: '🇫🇷', 
    nativeName: 'Français',
    shortName: 'FR'
  },
  'de': { 
    name: 'Deutsch', 
    flag: '🇩🇪', 
    nativeName: 'Deutsch',
    shortName: 'DE'
  },
  'ru': { 
    name: 'Русский', 
    flag: '🇷🇺', 
    nativeName: 'Русский',
    shortName: 'РУ'
  },
  'it': { 
    name: 'Italiano', 
    flag: '🇮🇹', 
    nativeName: 'Italiano',
    shortName: 'IT'
  },
  'pt-BR': { 
    name: 'Português (BR)', 
    flag: '🇧🇷', 
    nativeName: 'Português',
    shortName: 'PT'
  },
  
  // 其他语言
  'ar': { 
    name: 'العربية', 
    flag: '🇸🇦', 
    nativeName: 'العربية',
    shortName: 'ع',
    rtl: true 
  },
  'hi': { 
    name: 'हिन्दी', 
    flag: '🇮🇳', 
    nativeName: 'हिन्दी',
    shortName: 'हि'
  },
  'vi': { 
    name: 'Tiếng Việt', 
    flag: '🇻🇳', 
    nativeName: 'Tiếng Việt',
    shortName: 'VI'
  }
}

// 按地区分组
export const eastAsianLanguages = {
  'zh-CN': languages['zh-CN'],
  'zh-TW': languages['zh-TW'],
  'ja': languages['ja'],
  'ko': languages['ko']
}

export const europeanLanguages = {
  'en': languages['en'],
  'es': languages['es'],
  'fr': languages['fr'],
  'de': languages['de'],
  'ru': languages['ru'],
  'it': languages['it'],
  'pt-BR': languages['pt-BR']
}

export const otherLanguages = {
  'ar': languages['ar'],
  'hi': languages['hi'],
  'vi': languages['vi']
}

// 默认语言
export const defaultLocale = 'en'

// 回退语言
export const fallbackLocale = 'en'

// 检测浏览器语言
export function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage
  
  // 精确匹配
  if (languages[browserLang]) {
    return browserLang
  }
  
  // 语言代码匹配（忽略地区）
  const langCode = browserLang.split('-')[0]
  const matchedLang = Object.keys(languages).find(key => key.startsWith(langCode))
  
  return matchedLang || defaultLocale
}

// 获取存储的语言
export function getStoredLanguage() {
  return localStorage.getItem('preferred-language')
}

// 保存语言选择
export function saveLanguage(locale) {
  localStorage.setItem('preferred-language', locale)
}