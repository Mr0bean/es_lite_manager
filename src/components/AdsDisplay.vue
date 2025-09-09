<template>
  <div v-if="adsEnabled && visibleAds.length > 0" class="ads-container" :class="`ads-${position}`">
    <div class="ads-header" v-if="showHeader">
      <span class="ads-title">社区推荐</span>
      <el-button 
        v-if="showRefresh"
        size="small" 
        circle 
        @click="refreshAds"
        :loading="loading"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>
    
    <transition-group name="fade" tag="div" class="ads-content">
      <div 
        v-for="ad in currentAds" 
        :key="ad.id"
        class="ad-item"
        :class="`ad-type-${ad.type}`"
      >
        <!-- Banner 类型广告 -->
        <div v-if="ad.type === 'banner'" class="ad-banner" @click="handleAdClick(ad)">
          <img 
            v-if="ad.image" 
            :src="ad.image" 
            :alt="ad.title"
            @error="handleImageError"
          />
          <div class="ad-banner-content">
            <h4>{{ ad.title }}</h4>
            <p v-if="ad.description">{{ ad.description }}</p>
          </div>
        </div>
        
        <!-- 文本类型广告 -->
        <div v-else-if="ad.type === 'text'" class="ad-text" @click="handleAdClick(ad)">
          <h4>{{ ad.title }}</h4>
          <p>{{ ad.description }}</p>
          <span class="ad-link-hint">了解更多 →</span>
        </div>
        
        <!-- 卡片类型广告 -->
        <div v-else-if="ad.type === 'card'" class="ad-card">
          <h4>{{ ad.title }}</h4>
          <div class="ad-card-items">
            <div 
              v-for="(item, index) in ad.items" 
              :key="index"
              class="ad-card-item"
              @click="handleItemClick(item)"
            >
              <span class="item-icon">{{ item.icon || '🔗' }}</span>
              <div class="item-content">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-desc">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
    
    <!-- 轮播指示器 -->
    <div v-if="showIndicators && totalPages > 1" class="ads-indicators">
      <span 
        v-for="i in totalPages" 
        :key="i"
        class="indicator"
        :class="{ active: i === currentPage }"
        @click="goToPage(i)"
      ></span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import adsService from '@/api/ads'

export default {
  name: 'AdsDisplay',
  components: {
    Refresh
  },
  props: {
    position: {
      type: String,
      default: 'sidebar',
      validator: value => ['sidebar', 'bottom', 'popup'].includes(value)
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    showRefresh: {
      type: Boolean,
      default: true
    },
    showIndicators: {
      type: Boolean,
      default: true
    },
    autoRotate: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const loading = ref(false)
    const adsData = ref(null)
    const currentPage = ref(1)
    const rotationTimer = ref(null)
    const refreshTimer = ref(null)
    
    const adsEnabled = computed(() => adsData.value?.enabled ?? false)
    const visibleAds = computed(() => adsData.value?.ads || [])
    const settings = computed(() => adsData.value?.settings || {})
    
    const adsPerPage = computed(() => {
      if (props.position === 'sidebar') return 1
      if (props.position === 'bottom') return 3
      return settings.value.maxAdsToShow || 2
    })
    
    const totalPages = computed(() => 
      Math.ceil(visibleAds.value.length / adsPerPage.value)
    )
    
    const currentAds = computed(() => {
      const start = (currentPage.value - 1) * adsPerPage.value
      const end = start + adsPerPage.value
      return visibleAds.value.slice(start, end)
    })
    
    const loadAds = async (forceRefresh = false) => {
      loading.value = true
      try {
        const data = await adsService.getAds(forceRefresh)
        adsData.value = data
        
        if (data.enabled && data.ads.length > 0) {
          startRotation()
          scheduleRefresh()
        }
      } catch (error) {
        console.error('Failed to load ads:', error)
        ElMessage.error('加载广告失败')
      } finally {
        loading.value = false
      }
    }
    
    const refreshAds = () => {
      loadAds(true)
    }
    
    const handleAdClick = (ad) => {
      if (ad.link) {
        // 在 Electron 环境中使用系统浏览器打开
        if (window.electron && window.electron.openExternal) {
          window.electron.openExternal(ad.link)
        } else {
          window.open(ad.link, ad.target || '_blank')
        }
        trackAdClick(ad)
      }
    }
    
    const handleItemClick = (item) => {
      if (item.link) {
        // 在 Electron 环境中使用系统浏览器打开
        if (window.electron && window.electron.openExternal) {
          window.electron.openExternal(item.link)
        } else {
          window.open(item.link, '_blank')
        }
      }
    }
    
    const handleImageError = (event) => {
      event.target.style.display = 'none'
    }
    
    const goToPage = (page) => {
      currentPage.value = page
      resetRotation()
    }
    
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      } else {
        currentPage.value = 1
      }
    }
    
    const startRotation = () => {
      if (!props.autoRotate || totalPages.value <= 1) return
      
      stopRotation()
      const interval = settings.value.rotationInterval || 10000
      rotationTimer.value = setInterval(nextPage, interval)
    }
    
    const stopRotation = () => {
      if (rotationTimer.value) {
        clearInterval(rotationTimer.value)
        rotationTimer.value = null
      }
    }
    
    const resetRotation = () => {
      stopRotation()
      startRotation()
    }
    
    const scheduleRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
      }
      
      const interval = settings.value.refreshInterval || 3600000
      refreshTimer.value = setInterval(() => loadAds(true), interval)
    }
    
    const trackAdClick = (ad) => {
      try {
        const clickData = {
          adId: ad.id,
          timestamp: new Date().toISOString(),
          type: ad.type
        }
        
        const clicks = JSON.parse(localStorage.getItem('es_manager_ad_clicks') || '[]')
        clicks.push(clickData)
        
        if (clicks.length > 100) {
          clicks.shift()
        }
        
        localStorage.setItem('es_manager_ad_clicks', JSON.stringify(clicks))
      } catch (error) {
        console.warn('Failed to track ad click:', error)
      }
    }
    
    onMounted(() => {
      loadAds()
    })
    
    onUnmounted(() => {
      stopRotation()
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
      }
    })
    
    return {
      loading,
      adsEnabled,
      visibleAds,
      currentAds,
      currentPage,
      totalPages,
      refreshAds,
      handleAdClick,
      handleItemClick,
      handleImageError,
      goToPage,
      Refresh
    }
  }
}
</script>

<style scoped>
.ads-container {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.ads-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.ads-sidebar {
  width: 100%;
  margin-bottom: 20px;
}

.ads-bottom {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  z-index: 1000;
}

.ads-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
  min-width: 400px;
}

.ads-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.ads-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.ads-content {
  min-height: 60px;
}

.ad-item {
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.ad-item:last-child {
  margin-bottom: 0;
}

.ad-item:hover {
  transform: translateX(2px);
}

.ad-banner {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ad-banner img {
  width: 100%;
  height: auto;
  display: block;
}

.ad-banner-content {
  padding: 12px;
  color: white;
}

.ad-banner-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.ad-banner-content p {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.ad-text {
  padding: 12px;
  background: #f7f9fc;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.ad-text h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #333;
}

.ad-text p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.ad-link-hint {
  font-size: 11px;
  color: #1890ff;
  font-weight: 500;
}

.ad-card {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.ad-card h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.ad-card-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ad-card-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ad-card-item:hover {
  background: #f0f7ff;
  transform: translateX(2px);
}

.item-icon {
  font-size: 20px;
  margin-right: 10px;
}

.item-content {
  flex: 1;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.item-desc {
  font-size: 11px;
  color: #999;
}

.ads-indicators {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ddd;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  width: 16px;
  border-radius: 3px;
  background: #1890ff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>