/**
 * 本地存储工具类
 * 用于记录用户的选择状态，实现记忆功能
 */

const STORAGE_KEYS = {
  LAST_SELECTED_INDEX: 'es_last_selected_index',
  LAST_QUERY_TYPE: 'es_last_query_type',
  LAST_PAGE_SIZE: 'es_last_page_size',
  AVAILABLE_INDICES: 'es_available_indices'
}

class StorageManager {
  /**
   * 设置最后选择的索引
   * @param {string} index 索引名称
   */
  setLastSelectedIndex(index) {
    if (index) {
      localStorage.setItem(STORAGE_KEYS.LAST_SELECTED_INDEX, index)
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED_INDEX)
    }
  }

  /**
   * 获取最后选择的索引
   * @param {Array} availableIndices 当前可用的索引列表
   * @returns {string|null} 索引名称或null
   */
  getLastSelectedIndex(availableIndices = []) {
    const lastIndex = localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_INDEX)
    
    // 如果没有记录，返回null
    if (!lastIndex) return null
    
    // 检查上次选择的索引是否还存在于当前可用索引中
    const indexExists = availableIndices.some(idx => 
      (typeof idx === 'string' ? idx : idx.index) === lastIndex
    )
    
    // 如果索引不存在了，清除记录并返回null
    if (!indexExists) {
      this.setLastSelectedIndex(null)
      return null
    }
    
    return lastIndex
  }

  /**
   * 设置最后选择的查询类型
   * @param {string} queryType 查询类型
   */
  setLastQueryType(queryType) {
    if (queryType) {
      localStorage.setItem(STORAGE_KEYS.LAST_QUERY_TYPE, queryType)
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_QUERY_TYPE)
    }
  }

  /**
   * 获取最后选择的查询类型
   * @param {Array} availableTypes 可用的查询类型列表
   * @returns {string|null} 查询类型或null
   */
  getLastQueryType(availableTypes = ['match_all', 'match', 'term', 'range', 'bool']) {
    const lastType = localStorage.getItem(STORAGE_KEYS.LAST_QUERY_TYPE)
    
    if (!lastType) return null
    
    // 检查上次选择的查询类型是否还在可用列表中
    if (!availableTypes.includes(lastType)) {
      this.setLastQueryType(null)
      return null
    }
    
    return lastType
  }

  /**
   * 设置最后选择的页面大小
   * @param {number} pageSize 页面大小
   */
  setLastPageSize(pageSize) {
    if (pageSize) {
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE_SIZE, pageSize.toString())
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_PAGE_SIZE)
    }
  }

  /**
   * 获取最后选择的页面大小
   * @param {Array} availableSizes 可用的页面大小列表
   * @returns {number|null} 页面大小或null
   */
  getLastPageSize(availableSizes = [10, 20, 50, 100]) {
    const lastSize = localStorage.getItem(STORAGE_KEYS.LAST_PAGE_SIZE)
    
    if (!lastSize) return null
    
    const sizeNum = parseInt(lastSize)
    
    // 检查上次选择的页面大小是否还在可用列表中
    if (!availableSizes.includes(sizeNum)) {
      this.setLastPageSize(null)
      return null
    }
    
    return sizeNum
  }

  /**
   * 更新可用索引列表（用于检查索引是否还存在）
   * @param {Array} indices 索引列表
   */
  updateAvailableIndices(indices) {
    const indexNames = indices.map(idx => typeof idx === 'string' ? idx : idx.index)
    localStorage.setItem(STORAGE_KEYS.AVAILABLE_INDICES, JSON.stringify(indexNames))
  }

  /**
   * 获取存储的可用索引列表
   * @returns {Array} 索引名称列表
   */
  getAvailableIndices() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AVAILABLE_INDICES)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * 清除所有存储的选择记录
   */
  clearAllSelections() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  /**
   * 清除特定索引相关的选择记录
   * @param {string} index 索引名称
   */
  clearIndexSelections(index) {
    const currentIndex = this.getLastSelectedIndex()
    if (currentIndex === index) {
      this.setLastSelectedIndex(null)
    }
  }
}

// 创建单例实例
const storageManager = new StorageManager()

export default storageManager
export { STORAGE_KEYS }