// 预设主题配置
const themes = {
  light1: { bgColor: '#ffffff', sidebarColor: '#f5f5f5', inputBgColor: '#f8f9fa' },
  light2: { bgColor: '#f0f2f5', sidebarColor: '#e6e8eb', inputBgColor: '#e9ecef' },
  light3: { bgColor: '#f8f9fa', sidebarColor: '#e9ecef', inputBgColor: '#f0f2f5' },
  light4: { bgColor: '#ffffff', sidebarColor: '#edf2f7', inputBgColor: '#f7fafc' },
  dark1: { bgColor: '#1a1a1a', sidebarColor: '#2d2d2d', inputBgColor: '#333333' },
  dark2: { bgColor: '#2c2c2c', sidebarColor: '#3d3d3d', inputBgColor: '#404040' },
  dark3: { bgColor: '#1e1e1e', sidebarColor: '#2f2f2f', inputBgColor: '#363636' },
  dark4: { bgColor: '#242424', sidebarColor: '#363636', inputBgColor: '#404040' },
  system1: { bgColor: '#ffffff', sidebarColor: '#f5f5f5', inputBgColor: '#f8f9fa' },
  system2: { bgColor: '#f5f5f5', sidebarColor: '#2d2d2d', inputBgColor: '#e9ecef' },
  system3: { bgColor: '#f0f2f5', sidebarColor: '#2c2c2c', inputBgColor: '#e6e8eb' },
  system4: { bgColor: '#f8f9fa', sidebarColor: '#1e1e1e', inputBgColor: '#f0f2f5' }
};

document.addEventListener('DOMContentLoaded', async function () {
  // 获取DOM元素
  const bgColorPicker = document.getElementById('bgColor');
  const sidebarColorPicker = document.getElementById('sidebarColor');
  const inputBgColorPicker = document.getElementById('inputBgColor');
  const fontFamilySelect = document.getElementById('fontFamily');
  const showButtonsToggle = document.getElementById('showButtons');
  const resetAllButton = document.getElementById('resetAll');
  const themeItems = document.querySelectorAll('.theme-item');
  const bgImageInput = document.getElementById('bgImage');
  const bgImageMode = document.getElementById('bgImageMode');
  const bgImageConfirm = document.getElementById('bgImageConfirm');
  const clearBgImage = document.getElementById('clearBgImage');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const presetTab = document.getElementById('presetTab');
  const customTab = document.getElementById('customTab');
  const presetImages = document.getElementById('presetImages');
  const localImageBtn = document.getElementById('localImageBtn');
  const localImageInput = document.getElementById('localImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const questionFontColor = document.getElementById('questionFontColor');
  const answerFontColor = document.getElementById('answerFontColor');

  // 重置所有设置的默认值
  const defaultSettings = {
    bgColor: '#ffffff',
    sidebarColor: '#f5f5f5',
    inputBgColor: '#f8f9fa',
    fontFamily: 'system-ui',
    showButtons: false,
    bgImageMode: 'cover',
    activeTab: 'preset',
    answerFontColor: '#000000',
    questionFontColor: '#000000'
  };

  // 重置所有设置按钮点击事件
  resetAllButton.addEventListener('click', function () {
    // 清除所有存储的设置
    chrome.storage.sync.clear();
    chrome.storage.local.clear();

    // 重置所有输入控件的值
    bgColorPicker.value = defaultSettings.bgColor;
    sidebarColorPicker.value = defaultSettings.sidebarColor;
    inputBgColorPicker.value = defaultSettings.inputBgColor;
    fontFamilySelect.value = defaultSettings.fontFamily;
    showButtonsToggle.checked = defaultSettings.showButtons;
    bgImageMode.value = defaultSettings.bgImageMode;
    answerFontColor.value = defaultSettings.answerFontColor;
    questionFontColor.value = defaultSettings.questionFontColor;
    bgImageInput.value = '';
    imagePreview.style.display = 'none';

    // 重新保存默认设置
    chrome.storage.sync.set(defaultSettings, function () {
      // 通知当前标签页更新样式
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateStyle',
            settings: defaultSettings
          });
        }
      });
    });
  });

  // 加载预设图片
  try {
    const response = await fetch('presets/config.json');
    const config = await response.json();
    config.presetImages.forEach(image => {
      const imageItem = document.createElement('div');
      imageItem.className = 'preset-image-item';
      imageItem.innerHTML = `
        <img src="${image.thumbnail}" alt="${image.name}" />
        <div class="image-name">${image.name}</div>
        <div class="loading-indicator" style="display: none;">加载中...</div>
      `;
      imageItem.addEventListener('click', async () => {
        const loadingIndicator = imageItem.querySelector('.loading-indicator');
        loadingIndicator.style.display = 'block';

        try {
          // 预加载图片
          const img = new Image();
          img.src = image.url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => {
              // 图片加载失败时，尝试添加时间戳参数重试一次
              const retryUrl = image.url.includes('?') ?
                `${image.url}&t=${new Date().getTime()}` :
                `${image.url}?t=${new Date().getTime()}`;

              const retryImg = new Image();
              retryImg.onload = resolve;
              retryImg.onerror = reject;
              retryImg.src = retryUrl;
              // 更新URL为带时间戳的URL
              image.url = retryUrl;
            };
          });

          // 设置预设图片的URL
          bgImageInput.value = image.url;
          previewImg.src = image.url;
          imagePreview.style.display = 'block';

          // 先保存当前活动的标签页为预设
          // 使用chrome.storage.local存储图片数据
          chrome.storage.local.set({
            bgImage: image.url
          }, () => {
            // 在local存储成功后，将非图片数据保存到sync
            chrome.storage.sync.set({
              activeTab: 'preset',
              bgImageMode: bgImageMode.value || 'cover'
            }, () => {
              // 确保存储成功后再发送消息更新样式
              chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'updateStyle',
                    settings: {
                      bgImage: image.url,
                      bgImageMode: bgImageMode.value || 'cover'
                    }
                  });
                }
              });
            });
          });

          // 更新UI状态
          tabBtns.forEach(b => b.classList.remove('active'));
          document.querySelector('[data-tab="preset"]').classList.add('active');
          presetTab.style.display = 'block';
          customTab.style.display = 'none';

        } catch (error) {
          console.error('图片加载失败:', error);
          alert('图片加载失败，请重试');
        } finally {
          loadingIndicator.style.display = 'none';
        }
      });
      presetImages.appendChild(imageItem);
    });
  } catch (error) {
    console.error('加载预设图片失败:', error);
    alert('加载预设图片配置失败，请刷新页面重试');
  }

  // 标签页切换
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      if (tabId === 'preset') {
        presetTab.style.display = 'block';
        customTab.style.display = 'none';
        // 切换到预设图片时，不清除自定义图片输入框的值和预览
        // bgImageInput.value = '';
        // imagePreview.style.display = 'none';
      } else {
        presetTab.style.display = 'none';
        customTab.style.display = 'block';
      }

      // 保存当前活动的标签页
      chrome.storage.sync.set({ activeTab: tabId });
    });
  });

  // 本地图片上传
  localImageBtn.addEventListener('click', () => {
    localImageInput.click();
  });

  localImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择有效的图片文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataUrl = e.target.result;
          // 预加载图片
          const img = new Image();
          img.onload = () => {
            // 图片加载成功后，保存设置并更新样式
            // 使用chrome.storage.local而不是sync来存储图片数据
            chrome.storage.local.set({
              bgImage: dataUrl
            }, () => {
              // 在local存储成功后，将非图片数据保存到sync
              chrome.storage.sync.set({
                bgImageMode: bgImageMode.value,
                activeTab: 'custom' // 确保设置活动标签页为自定义
              }, () => {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                  if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      type: 'updateStyle',
                      settings: {
                        bgImage: dataUrl,
                        bgImageMode: bgImageMode.value
                      }
                    });
                  }
                });
              });
            });

            // 更新预览
            bgImageInput.value = dataUrl;
            previewImg.src = dataUrl;
            imagePreview.style.display = 'block';
            // 切换到自定义图片标签页
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tab="custom"]').classList.add('active');
            presetTab.style.display = 'none';
            customTab.style.display = 'block';
          };
          img.onerror = () => {
            console.error('图片加载失败');
            alert('图片加载失败，请重试');
          };
          img.src = dataUrl;
        } catch (error) {
          console.error('处理图片时发生错误:', error);
          alert('处理图片时发生错误，请重试');
        }
      };
      reader.onerror = () => {
        console.error('读取文件失败');
        alert('读取文件失败，请重试');
      };
      reader.readAsDataURL(file);
    }
  });

  // URL输入预览
  bgImageInput.addEventListener('input', () => {
    const url = bgImageInput.value.trim();
    if (url) {
      previewImg.src = url;
      imagePreview.style.display = 'block';
      // 切换到自定义图片标签页并保存状态
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-tab="custom"]').classList.add('active');
      presetTab.style.display = 'none';
      customTab.style.display = 'block';

      // 保存当前活动的标签页为自定义
      chrome.storage.sync.set({ activeTab: 'custom' });
    } else {
      imagePreview.style.display = 'none';
    }
  });

  // 获取确认按钮元素
  const bgColorConfirm = document.getElementById('bgColorConfirm');
  const sidebarColorConfirm = document.getElementById('sidebarColorConfirm');
  const inputBgColorConfirm = document.getElementById('inputBgColorConfirm');
  const qstFontColorBtn = document.getElementById('questionFontColorConfirm');
  const aswFontColorBtn = document.getElementById('answerFontColorConfirm');

  // 从存储中加载保存的设置
  const setArr = ['bgColor', 'sidebarColor', 'inputBgColor', 'fontFamily', 'showButtons', 'activeTheme', 'bgImageMode', 'activeTab', "questionFontColor", "answerFontColor"]
  chrome.storage.sync.get(setArr, function (syncResult) {
    chrome.storage.local.get(['bgImage'], function (localResult) {
      // 合并两个存储的设置
      const result = { ...syncResult, ...localResult };

      if (result.bgColor) bgColorPicker.value = result.bgColor;
      if (result.sidebarColor) sidebarColorPicker.value = result.sidebarColor;
      if (result.inputBgColor) inputBgColorPicker.value = result.inputBgColor;
      if (result.fontFamily) fontFamilySelect.value = result.fontFamily;
      if (typeof result.showButtons !== 'undefined') showButtonsToggle.checked = result.showButtons;
      if (result.bgImage) {
        bgImageInput.value = result.bgImage;
        previewImg.src = result.bgImage;
        imagePreview.style.display = 'block';
      }
      if (result.bgImageMode) bgImageMode.value = result.bgImageMode;
      if (result.questionFontColor) questionFontColor.value = result.questionFontColor;
      if (result.answerFontColor) answerFontColor.value = result.answerFontColor;

      // 根据保存的标签页状态切换到相应的标签页
      if (result.activeTab) {
        tabBtns.forEach(b => b.classList.remove('active'));
        const activeTabBtn = document.querySelector(`[data-tab="${result.activeTab}"]`);
        if (activeTabBtn) {
          activeTabBtn.classList.add('active');
          if (result.activeTab === 'preset') {
            presetTab.style.display = 'block';
            customTab.style.display = 'none';
          } else {
            presetTab.style.display = 'none';
            customTab.style.display = 'block';
          }
        }
      }

      // 设置活动主题的样式
      if (result.activeTheme) {
        const activeThemeItem = document.querySelector(`[data-theme="${result.activeTheme}"]`);
        if (activeThemeItem) {
          document.querySelectorAll('.theme-item').forEach(item => item.classList.remove('active'));
          activeThemeItem.classList.add('active');
        }
      }
    });
  });

  // 添加主题选择事件监听
  themeItems.forEach(item => {
    item.addEventListener('click', () => {
      const themeKey = item.getAttribute('data-theme');
      const themeConfig = themes[themeKey];

      if (themeConfig) {
        // 更新颜色选择器的值
        bgColorPicker.value = themeConfig.bgColor;
        sidebarColorPicker.value = themeConfig.sidebarColor;
        inputBgColorPicker.value = themeConfig.inputBgColor;

        // 保存主题设置
        chrome.storage.sync.set({
          activeTheme: themeKey,
          ...themeConfig
        }, function () {
          // 更新页面样式
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'updateStyle',
                settings: themeConfig
              });
            }
          });
        });

        // 更新主题选择器的视觉状态
        document.querySelectorAll('.theme-item').forEach(item => item.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });

  // 监听确认按钮点击事件
  bgColorConfirm.addEventListener('click', () => {
    saveSettings('bgColor', bgColorPicker.value);
  });

  sidebarColorConfirm.addEventListener('click', () => {
    saveSettings('sidebarColor', sidebarColorPicker.value);
  });

  inputBgColorConfirm.addEventListener('click', () => {
    saveSettings('inputBgColor', inputBgColorPicker.value);
  });

  // 监听字体选择变化
  fontFamilySelect.addEventListener('change', () => {
    saveSettings('fontFamily', fontFamilySelect.value);
  });

  // 问题字体颜色确认按钮点击事件
  qstFontColorBtn.addEventListener('click', () => {
    saveSettings('questionFontColor', questionFontColor.value);
  });

  // 回答字体颜色确认按钮点击事件
  aswFontColorBtn.addEventListener('click', () => {
    saveSettings('answerFontColor', answerFontColor.value);
  });

  // 监听清除背景按钮点击
  clearBgImage.addEventListener('click', () => {
    // 清除背景图片，同时从local和sync存储中清除
    chrome.storage.local.remove(['bgImage'], () => {
      chrome.storage.sync.set({
        bgImageMode: 'cover'
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'updateStyle',
              settings: {
                bgImage: null,
                bgImageMode: 'cover'
              }
            });
          }
        });
      });
    });

    // 更新UI
    bgImageInput.value = '';
    imagePreview.style.display = 'none';
  });

  // 监听背景图片确认按钮点击
  // 背景图片确认按钮点击事件
  bgImageConfirm.addEventListener('click', () => {
    const imageUrl = bgImageInput.value.trim();
    const mode = bgImageMode.value;

    if (imageUrl) {
      // 显示加载指示器或禁用按钮，防止重复点击
      bgImageConfirm.disabled = true;
      bgImageConfirm.textContent = '加载中...';

      // 预加载图片以验证URL是否有效
      const img = new Image();
      img.onload = () => {
        // 图片加载成功，保存设置
        // 使用chrome.storage.local存储图片数据
        chrome.storage.local.set({
          bgImage: imageUrl
        }, () => {
          // 在local存储成功后，将非图片数据保存到sync
          chrome.storage.sync.set({
            bgImageMode: mode,
            activeTab: 'custom' // 确保保存当前活动的标签页为自定义
          }, () => {
            // 确保存储成功后再发送消息更新样式
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: 'updateStyle',
                  settings: {
                    bgImage: imageUrl,
                    bgImageMode: mode
                  }
                });
              }
              // 恢复按钮状态
              bgImageConfirm.disabled = false;
              bgImageConfirm.textContent = '确定';
            });
          });
        });
      };
      img.onerror = () => {
        // 图片加载失败，尝试添加时间戳参数重试一次
        console.log('图片加载失败，尝试添加时间戳重试:', imageUrl);
        const retryUrl = imageUrl.includes('?') ?
          `${imageUrl}&t=${new Date().getTime()}` :
          `${imageUrl}?t=${new Date().getTime()}`;

        const retryImg = new Image();
        retryImg.onload = () => {
          // 重试成功，使用新URL保存设置
          chrome.storage.sync.set({
            bgImage: retryUrl,
            bgImageMode: mode,
            activeTab: 'custom'
          }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  type: 'updateStyle',
                  settings: {
                    bgImage: retryUrl,
                    bgImageMode: mode
                  }
                });
              }
              // 更新输入框和预览
              bgImageInput.value = retryUrl;
              previewImg.src = retryUrl;
              // 恢复按钮状态
              bgImageConfirm.disabled = false;
              bgImageConfirm.textContent = '确定';
            });
          });
        };
        retryImg.onerror = () => {
          // 重试仍然失败
          console.error('图片加载失败:', imageUrl);
          alert('图片加载失败，请检查URL是否正确或尝试其他图片');
          // 恢复按钮状态
          bgImageConfirm.disabled = false;
          bgImageConfirm.textContent = '确定';
        };
        retryImg.src = retryUrl;
      };
      img.src = imageUrl;
    } else {
      // 如果URL为空，清除背景图片
      chrome.storage.sync.set({
        bgImage: null,
        bgImageMode: 'cover',
        activeTab: 'custom'
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'updateStyle',
              settings: {
                bgImage: null,
                bgImageMode: 'cover'
              }
            });
          }
        });
      });
    }
  });

  // 监听按钮显示控制开关
  showButtonsToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ showButtons: showButtonsToggle.checked });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'toggleButtons',
          value: showButtonsToggle.checked
        });
      }
    });
  });

  // 监听重置按钮点击
  resetAllButton.addEventListener('click', () => {
    const defaultSettings = {
      bgColor: '#ffffff',
      sidebarColor: '#f5f5f5',
      inputBgColor: 'rgb(243 244 246)',
      fontFamily: 'system-ui',
      showButtons: true,
      bgImage: '',
      bgImageMode: 'cover'
    };

    // 更新UI
    bgColorPicker.value = defaultSettings.bgColor;
    sidebarColorPicker.value = defaultSettings.sidebarColor;
    inputBgColorPicker.value = defaultSettings.inputBgColor;
    fontFamilySelect.value = defaultSettings.fontFamily;
    showButtonsToggle.checked = defaultSettings.showButtons;

    // 保存到存储并更新页面
    chrome.storage.sync.set(defaultSettings, function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'updateStyle',
            settings: defaultSettings
          });
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'toggleButtons',
            value: defaultSettings.showButtons
          });
        }
      });
    });
  });
});

function saveSettings(key, value) {
  const settings = {};
  settings[key] = value;

  chrome.storage.sync.set(settings, function () {
    // 通知当前标签页更新样式
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'updateStyle',
          key: key,
          value: value
        });
      }
    });
  });
}
// 监听来自content.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'bgImageLoadError') {
    // 显示图片加载错误提示
    alert(`图片加载失败: ${message.url}\n请检查URL是否正确或尝试其他图片`);
  }
});
// 存储插件状态和设置
let pluginEnabled = true;
let savedSettings = null;

document.addEventListener('DOMContentLoaded', function () {
  // 获取开关元素
  const pluginSwitch = document.getElementById('pluginSwitch');

  // 从存储中加载插件状态
  chrome.storage.sync.get(['pluginEnabled', 'savedSettings'], function (result) {
    pluginEnabled = result.pluginEnabled !== undefined ? result.pluginEnabled : true;
    savedSettings = result.savedSettings;

    // 设置开关状态
    pluginSwitch.checked = pluginEnabled;

    // 如果插件被禁用，隐藏所有控制元素
    if (!pluginEnabled) {
      document.querySelectorAll('.control-group').forEach(group => {
        if (!group.querySelector('#pluginSwitch')) {
          group.style.display = 'none';
        }
      });
    }
  });

  // 监听开关变化
  pluginSwitch.addEventListener('change', function () {
    pluginEnabled = this.checked;

    // 保存插件状态
    chrome.storage.sync.set({ pluginEnabled });

    if (pluginEnabled) {
      // 启用插件时恢复保存的设置
      if (savedSettings) {
        chrome.storage.sync.set(savedSettings);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'updateStyle',
              settings: savedSettings
            });
          }
        });
      }
      // 显示所有控制元素
      document.querySelectorAll('.control-group').forEach(group => {
        group.style.display = 'block';
      });
    } else {
      // 禁用插件时保存当前设置
      chrome.storage.sync.get(['bgColor', 'sidebarColor', 'inputBgColor', 'fontFamily', 'bgImageMode'], function (settings) {
        savedSettings = settings;
        chrome.storage.sync.set({ savedSettings });

        // 清除所有设置
        chrome.storage.sync.remove(['bgColor', 'sidebarColor', 'inputBgColor', 'fontFamily', 'bgImageMode']);
        chrome.storage.local.remove(['bgImage']);

        // 通知content脚本清除样式
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'clearStyle'
            });
          }
        });

        // 隐藏所有控制元素（除了开关）
        document.querySelectorAll('.control-group').forEach(group => {
          if (!group.querySelector('#pluginSwitch')) {
            group.style.display = 'none';
          }
        });
      });
    }
  });
});