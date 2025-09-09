import fetch from 'node-fetch';
import semver from 'semver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GitHub仓库信息配置
const GITHUB_REPO = {
  owner: 'your-username', // 需要替换为实际的GitHub用户名
  repo: 'es-manager',
  apiUrl: 'https://api.github.com'
};

// 获取当前应用版本
export function getCurrentVersion() {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);
    return null;
  }
}

// 从GitHub获取最新版本信息
export async function getLatestReleaseFromGitHub() {
  try {
    const url = `${GITHUB_REPO.apiUrl}/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/releases/latest`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ES-Manager-Version-Checker'
      },
      timeout: 10000
    });

    if (!response.ok) {
      if (response.status === 404) {
        // 没有发布版本，尝试获取tags
        return await getLatestTagFromGitHub();
      }
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      version: data.tag_name.replace(/^v/, ''), // 移除v前缀
      name: data.name || data.tag_name,
      publishedAt: data.published_at,
      body: data.body || '',
      htmlUrl: data.html_url,
      assets: data.assets ? data.assets.map(asset => ({
        name: asset.name,
        size: asset.size,
        downloadUrl: asset.browser_download_url
      })) : []
    };
  } catch (error) {
    console.error('Error fetching latest release from GitHub:', error);
    throw error;
  }
}

// 从GitHub获取最新的tag
async function getLatestTagFromGitHub() {
  try {
    const url = `${GITHUB_REPO.apiUrl}/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/tags`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ES-Manager-Version-Checker'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }

    const tags = await response.json();
    
    if (!tags || tags.length === 0) {
      return null;
    }

    // 获取最新的tag
    const latestTag = tags[0];
    
    return {
      version: latestTag.name.replace(/^v/, ''),
      name: latestTag.name,
      publishedAt: null,
      body: '',
      htmlUrl: `https://github.com/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}/releases/tag/${latestTag.name}`,
      assets: []
    };
  } catch (error) {
    console.error('Error fetching tags from GitHub:', error);
    throw error;
  }
}

// 比较版本
export function compareVersions(currentVersion, latestVersion) {
  try {
    // 清理版本号（移除v前缀等）
    const current = currentVersion.replace(/^v/, '');
    const latest = latestVersion.replace(/^v/, '');
    
    // 使用semver进行版本比较
    if (semver.valid(current) && semver.valid(latest)) {
      return {
        isUpdateAvailable: semver.lt(current, latest),
        isNewer: semver.gt(current, latest),
        isSame: semver.eq(current, latest),
        currentVersion: current,
        latestVersion: latest,
        diff: semver.diff(current, latest)
      };
    }
    
    // 如果版本号不符合semver规范，使用简单字符串比较
    return {
      isUpdateAvailable: current !== latest && current < latest,
      isNewer: current > latest,
      isSame: current === latest,
      currentVersion: current,
      latestVersion: latest,
      diff: null
    };
  } catch (error) {
    console.error('Error comparing versions:', error);
    return {
      isUpdateAvailable: false,
      isNewer: false,
      isSame: false,
      currentVersion: currentVersion,
      latestVersion: latestVersion,
      diff: null,
      error: error.message
    };
  }
}

// 检查更新主函数
export async function checkForUpdates() {
  try {
    const currentVersion = getCurrentVersion();
    
    if (!currentVersion) {
      throw new Error('Could not determine current version');
    }

    const latestRelease = await getLatestReleaseFromGitHub();
    
    if (!latestRelease) {
      return {
        success: false,
        message: 'No releases found',
        currentVersion
      };
    }

    const comparison = compareVersions(currentVersion, latestRelease.version);
    
    return {
      success: true,
      currentVersion,
      latestVersion: latestRelease.version,
      updateAvailable: comparison.isUpdateAvailable,
      isNewer: comparison.isNewer,
      isSame: comparison.isSame,
      versionDiff: comparison.diff,
      releaseInfo: {
        name: latestRelease.name,
        publishedAt: latestRelease.publishedAt,
        releaseNotes: latestRelease.body,
        downloadUrl: latestRelease.htmlUrl,
        assets: latestRelease.assets
      }
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      success: false,
      error: error.message,
      currentVersion: getCurrentVersion()
    };
  }
}

// 缓存管理
let updateCheckCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

export async function checkForUpdatesCached() {
  const now = Date.now();
  
  // 如果缓存存在且未过期，返回缓存结果
  if (updateCheckCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return {
      ...updateCheckCache,
      fromCache: true,
      cacheAge: Math.floor((now - cacheTimestamp) / 1000) // 缓存年龄（秒）
    };
  }
  
  // 获取新数据
  const result = await checkForUpdates();
  
  // 更新缓存
  if (result.success) {
    updateCheckCache = result;
    cacheTimestamp = now;
  }
  
  return {
    ...result,
    fromCache: false
  };
}

// 清除缓存
export function clearUpdateCache() {
  updateCheckCache = null;
  cacheTimestamp = null;
}