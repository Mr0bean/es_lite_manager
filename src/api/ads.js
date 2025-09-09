import axios from 'axios'

class AdsService {
  constructor() {
    this.config = {
      githubUser: import.meta.env.VITE_ADS_GITHUB_USER || 'your-github-username',
      githubRepo: import.meta.env.VITE_ADS_GITHUB_REPO || 'es-manager-ads',
      branch: import.meta.env.VITE_ADS_GITHUB_BRANCH || 'main',
      filePath: import.meta.env.VITE_ADS_FILE_PATH || 'ads.json',
      fallbackUrl: '/ads-config/ads.json',
      cacheKey: 'es_manager_ads_cache',
      cacheExpiry: parseInt(import.meta.env.VITE_ADS_CACHE_EXPIRY) || 3600000,
      enabled: import.meta.env.VITE_ADS_ENABLED !== 'false'
    }
    
    this.adsData = null
    this.lastFetchTime = null
  }

  getGitHubRawUrl() {
    const { githubUser, githubRepo, branch, filePath } = this.config
    return `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/${branch}/${filePath}`
  }

  async fetchFromGitHub() {
    try {
      const response = await axios.get(this.getGitHubRawUrl(), {
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      return response.data
    } catch (error) {
      console.warn('Failed to fetch ads from GitHub:', error.message)
      return null
    }
  }

  async fetchFromLocal() {
    try {
      const response = await axios.get(this.config.fallbackUrl)
      return response.data
    } catch (error) {
      console.error('Failed to fetch local ads:', error.message)
      return null
    }
  }

  loadFromCache() {
    try {
      const cached = localStorage.getItem(this.config.cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const now = Date.now()
        if (now - timestamp < this.config.cacheExpiry) {
          return data
        }
      }
    } catch (error) {
      console.warn('Failed to load ads from cache:', error.message)
    }
    return null
  }

  saveToCache(data) {
    try {
      localStorage.setItem(this.config.cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to save ads to cache:', error.message)
    }
  }

  async getAds(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this.loadFromCache()
      if (cached) {
        this.adsData = cached
        return this.filterActiveAds(cached)
      }
    }

    let data = await this.fetchFromGitHub()
    
    if (!data) {
      data = await this.fetchFromLocal()
    }

    if (data) {
      this.saveToCache(data)
      this.adsData = data
      return this.filterActiveAds(data)
    }

    return {
      enabled: false,
      ads: [],
      settings: {}
    }
  }

  filterActiveAds(data) {
    if (!data.enabled) {
      return { ...data, ads: [] }
    }

    const now = new Date()
    const activeAds = data.ads.filter(ad => {
      if (ad.startDate && new Date(ad.startDate) > now) {
        return false
      }
      if (ad.endDate && new Date(ad.endDate) < now) {
        return false
      }
      return true
    })

    activeAds.sort((a, b) => (a.priority || 999) - (b.priority || 999))

    const maxAds = data.settings?.maxAdsToShow || 2
    const limitedAds = activeAds.slice(0, maxAds)

    return {
      ...data,
      ads: limitedAds
    }
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config }
  }

  clearCache() {
    try {
      localStorage.removeItem(this.config.cacheKey)
      this.adsData = null
      this.lastFetchTime = null
    } catch (error) {
      console.warn('Failed to clear ads cache:', error.message)
    }
  }

  async testConnection() {
    try {
      const response = await axios.head(this.getGitHubRawUrl(), {
        timeout: 3000
      })
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}

export default new AdsService()