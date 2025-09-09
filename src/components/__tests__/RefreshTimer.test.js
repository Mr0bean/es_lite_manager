import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RefreshTimer from '../RefreshTimer.vue';

describe('RefreshTimer', () => {
  let wrapper;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('should render refresh button', () => {
      wrapper = mount(RefreshTimer);
      
      const button = wrapper.find('button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain('Refresh');
    });

    it('should display interval selector', () => {
      wrapper = mount(RefreshTimer);
      
      const select = wrapper.find('select');
      expect(select.exists()).toBe(true);
    });

    it('should show default interval options', () => {
      wrapper = mount(RefreshTimer);
      
      const options = wrapper.findAll('option');
      expect(options.length).toBeGreaterThan(0);
      
      const values = options.map(opt => opt.element.value);
      expect(values).toContain('0');
      expect(values).toContain('5000');
      expect(values).toContain('10000');
      expect(values).toContain('30000');
    });

    it('should accept custom intervals prop', () => {
      const customIntervals = [
        { label: '1s', value: 1000 },
        { label: '2s', value: 2000 }
      ];
      
      wrapper = mount(RefreshTimer, {
        props: { intervals: customIntervals }
      });
      
      const options = wrapper.findAll('option');
      expect(options).toHaveLength(customIntervals.length);
    });
  });

  describe('Manual Refresh', () => {
    it('should emit refresh event on button click', async () => {
      wrapper = mount(RefreshTimer);
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(wrapper.emitted('refresh')).toBeTruthy();
      expect(wrapper.emitted('refresh')).toHaveLength(1);
    });

    it('should call onRefresh callback if provided', async () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should disable button while refreshing', async () => {
      const onRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(button.element.disabled).toBe(true);
      
      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      
      expect(button.element.disabled).toBe(false);
    });
  });

  describe('Auto Refresh', () => {
    it('should not auto-refresh when interval is 0', () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh, defaultInterval: 0 }
      });
      
      vi.advanceTimersByTime(10000);
      
      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should auto-refresh at specified interval', () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh, defaultInterval: 5000 }
      });
      
      expect(onRefresh).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(5000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(5000);
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it('should update interval when selection changes', async () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh, defaultInterval: 0 }
      });
      
      const select = wrapper.find('select');
      await select.setValue('5000');
      
      vi.advanceTimersByTime(5000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should stop auto-refresh when interval set to 0', async () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh, defaultInterval: 5000 }
      });
      
      vi.advanceTimersByTime(5000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      
      const select = wrapper.find('select');
      await select.setValue('0');
      
      vi.advanceTimersByTime(10000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should clear timer on unmount', () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh, defaultInterval: 5000 }
      });
      
      wrapper.unmount();
      
      vi.advanceTimersByTime(10000);
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when refreshing', async () => {
      const onRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      expect(wrapper.find('.loading').exists()).toBe(false);
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(wrapper.find('.loading').exists()).toBe(true);
      
      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('.loading').exists()).toBe(false);
    });

    it('should handle refresh errors gracefully', async () => {
      const onRefresh = vi.fn(() => Promise.reject(new Error('Refresh failed')));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Refresh failed')
      );
      
      consoleError.mockRestore();
    });
  });

  describe('Props Validation', () => {
    it('should use default interval when not provided', () => {
      wrapper = mount(RefreshTimer);
      
      const select = wrapper.find('select');
      expect(select.element.value).toBe('0');
    });

    it('should accept and use defaultInterval prop', () => {
      wrapper = mount(RefreshTimer, {
        props: { defaultInterval: 10000 }
      });
      
      const select = wrapper.find('select');
      expect(select.element.value).toBe('10000');
    });

    it('should handle invalid interval gracefully', async () => {
      wrapper = mount(RefreshTimer, {
        props: { defaultInterval: -1000 }
      });
      
      const select = wrapper.find('select');
      expect(select.element.value).toBe('0');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      wrapper = mount(RefreshTimer);
      
      const button = wrapper.find('button');
      expect(button.attributes('aria-label')).toBeDefined();
      
      const select = wrapper.find('select');
      expect(select.attributes('aria-label')).toBeDefined();
    });

    it('should indicate loading state to screen readers', async () => {
      const onRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(button.attributes('aria-busy')).toBe('true');
      
      vi.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      
      expect(button.attributes('aria-busy')).toBe('false');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom class', () => {
      wrapper = mount(RefreshTimer, {
        props: { class: 'custom-timer' }
      });
      
      expect(wrapper.classes()).toContain('custom-timer');
    });

    it('should apply disabled styles when appropriate', async () => {
      wrapper = mount(RefreshTimer, {
        props: { disabled: true }
      });
      
      const button = wrapper.find('button');
      expect(button.element.disabled).toBe(true);
      expect(button.classes()).toContain('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', async () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      const button = wrapper.find('button');
      await button.trigger('click');
      await button.trigger('click');
      await button.trigger('click');
      
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle component destruction during refresh', async () => {
      const onRefresh = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      wrapper = mount(RefreshTimer, {
        props: { onRefresh }
      });
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      wrapper.unmount();
      vi.advanceTimersByTime(1000);
      
      expect(() => wrapper.unmount()).not.toThrow();
    });

    it('should reset timer when interval changes during countdown', async () => {
      const onRefresh = vi.fn();
      wrapper = mount(RefreshTimer, {
        props: { onRefresh, defaultInterval: 10000 }
      });
      
      vi.advanceTimersByTime(5000);
      
      const select = wrapper.find('select');
      await select.setValue('3000');
      
      vi.advanceTimersByTime(3000);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });
});