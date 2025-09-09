import { config } from '@vue/test-utils';
import { vi } from 'vitest';
import { createI18n } from 'vue-i18n';

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      common: {
        refresh: 'Refresh',
        auto_refresh: 'Auto Refresh',
        off: 'Off',
        seconds: 'seconds',
        minutes: 'minutes'
      }
    }
  },
  globalInjection: true
});

// Mock Element Plus components
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn(),
    alert: vi.fn(),
    prompt: vi.fn()
  },
  ElNotification: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElButton: { name: 'ElButton', template: '<button><slot /></button>' },
  ElIcon: { name: 'ElIcon', template: '<i><slot /></i>' },
  ElDropdown: { name: 'ElDropdown', template: '<div><slot /></div>' },
  ElDropdownMenu: { name: 'ElDropdownMenu', template: '<ul><slot /></ul>' },
  ElDropdownItem: { name: 'ElDropdownItem', template: '<li><slot /></li>' }
}));

// Mock icons
vi.mock('@element-plus/icons-vue', () => ({
  Refresh: { name: 'Refresh', template: '<i>refresh</i>' },
  ArrowDown: { name: 'ArrowDown', template: '<i>arrow-down</i>' },
  Clock: { name: 'Clock', template: '<i>clock</i>' }
}));

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/'
  }),
  createRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  })),
  createWebHistory: vi.fn()
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Configure Vue Test Utils
config.global.plugins = [i18n];
config.global.stubs = {
  teleport: true,
  Transition: false,
  'el-button': { template: '<button><slot /></button>' },
  'el-icon': { template: '<i><slot /></i>' },
  'el-dropdown': { template: '<div><slot /></div>' },
  'el-dropdown-menu': { template: '<ul><slot /></ul>' },
  'el-dropdown-item': { template: '<li><slot /></li>' }
};

// Global mocks
config.global.mocks = {
  $t: (key) => key,
  $i18n: i18n
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});