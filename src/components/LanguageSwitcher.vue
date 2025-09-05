<template>
  <div class="language-switcher">
    <el-dropdown 
      trigger="click" 
      @command="handleLanguageChange"
      popper-class="language-dropdown-popper"
    >
      <el-button text class="language-trigger">
        <span class="current-flag">{{ currentLanguage.flag }}</span>
        <span class="current-name">{{ currentLanguage.shortName }}</span>
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <!-- 东亚语言 -->
          <el-dropdown-item disabled class="group-header">
            {{ $t('language.eastAsian') }}
          </el-dropdown-item>
          <el-dropdown-item 
            v-for="(lang, code) in eastAsianLanguages" 
            :key="code"
            :command="code"
            :class="{ 'is-active': currentLocale === code }"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.nativeName }}</span>
            <el-icon v-if="currentLocale === code" class="check-icon">
              <Check />
            </el-icon>
          </el-dropdown-item>
          
          <!-- 欧洲语言 -->
          <el-dropdown-item disabled divided class="group-header">
            {{ $t('language.european') }}
          </el-dropdown-item>
          <el-dropdown-item 
            v-for="(lang, code) in europeanLanguages" 
            :key="code"
            :command="code"
            :class="{ 'is-active': currentLocale === code }"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.nativeName }}</span>
            <el-icon v-if="currentLocale === code" class="check-icon">
              <Check />
            </el-icon>
          </el-dropdown-item>
          
          <!-- 其他语言 -->
          <el-dropdown-item disabled divided class="group-header">
            {{ $t('language.others') }}
          </el-dropdown-item>
          <el-dropdown-item 
            v-for="(lang, code) in otherLanguages" 
            :key="code"
            :command="code"
            :class="{ 'is-active': currentLocale === code }"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.nativeName }}</span>
            <el-icon v-if="currentLocale === code" class="check-icon">
              <Check />
            </el-icon>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown, Check } from '@element-plus/icons-vue'
import { 
  languages, 
  eastAsianLanguages, 
  europeanLanguages, 
  otherLanguages,
  saveLanguage 
} from '@/i18n/languages'
import { setI18nLanguage } from '@/i18n'
import { ElMessage } from 'element-plus'

const { locale, t } = useI18n()

const currentLocale = computed(() => locale.value)

const currentLanguage = computed(() => {
  return languages[currentLocale.value] || languages['en']
})

const handleLanguageChange = async (code) => {
  if (code === currentLocale.value) return
  
  try {
    await setI18nLanguage(code)
    saveLanguage(code)
    
    // 显示切换成功提示（使用新语言）
    ElMessage.success({
      message: '✓',
      duration: 1000,
      center: true
    })
  } catch (error) {
    console.error('Failed to change language:', error)
    ElMessage.error(t('errors.languageSwitchFailed'))
  }
}
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
}

.language-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.language-trigger:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.current-flag {
  font-size: 18px;
  line-height: 1;
}

.current-name {
  font-weight: 500;
}

.language-trigger .el-icon {
  transition: transform 0.3s;
}

.language-trigger:hover .el-icon {
  transform: rotate(180deg);
}
</style>

<style>
/* 全局样式，影响下拉菜单 */
.language-dropdown-popper {
  min-width: 280px !important;
}

.language-dropdown-popper .el-dropdown-menu {
  padding: 8px 0;
}

.language-dropdown-popper .el-dropdown-menu__item {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.language-dropdown-popper .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: #f5f7fa;
  padding-left: 24px;
}

.language-dropdown-popper .el-dropdown-menu__item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.language-dropdown-popper .group-header {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 20px 4px;
  cursor: default !important;
}

.language-dropdown-popper .group-header:hover {
  background-color: transparent !important;
  padding-left: 20px !important;
}

.language-dropdown-popper .lang-flag {
  font-size: 20px;
  line-height: 1;
  width: 24px;
  text-align: center;
}

.language-dropdown-popper .lang-name {
  flex: 1;
}

.language-dropdown-popper .check-icon {
  margin-left: auto;
  color: #67c23a;
  font-size: 16px;
}
</style>