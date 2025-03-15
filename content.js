// 存储设置的键
const setArr = ['bgColor', 'sidebarColor', 'inputBgColor', 'fontFamily', 'showButtons', 'activeTheme', 'bgImageMode', 'activeTab', "questionFontColor", "answerFontColor"]
// 从存储中加载保存的设置并应用
// 修改初始加载逻辑，从local存储中获取bgImage
chrome.storage.sync.get(setArr, function (syncSettings) {
    chrome.storage.local.get(['bgImage'], function (localSettings) {
        // 合并两个存储的设置
        const mergedSettings = { ...syncSettings, ...localSettings };
        updateStyle(mergedSettings);
    });
});

// 监听来自popup的消息
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.type === 'updateStyle') {
//         updateStyle(request.key, request.value);
//     }
// });

// 更新页面样式
// function updateStyle(key, value) {
//     switch (key) {
//         case 'bgColor':
//             document.body.style.backgroundColor = value;
//             break;
//         case 'sidebarColor':
//             const sidebar = document.querySelector('.sidebar');
//             if (sidebar) sidebar.style.backgroundColor = value;
//             break;
//         case 'fontFamily':
//             document.body.style.fontFamily = value;
//             break;
//         case 'questionFontColor':
//             document.body.style.fontFamily = value;
//             break;
//         case 'answerFontColor':
//             // 移除无效代码并添加强制样式
//             const paragraphs = document.querySelectorAll('p');
//             paragraphs.forEach(p => p.style.setProperty('color', value, 'important'));
//             break;
//     }
// }

// 创建和更新样式
function updateStyle(settings) {
    let styleEl = document.getElementById('custom-deepseek-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-deepseek-style';
        document.head.appendChild(styleEl);
    }

    let styles = '';

    // 基础样式
    styles += `
        body {
            background-color: ${settings.bgColor || '#ffffff'} !important;
            color: var(--dsr-text-0) !important;
        }

        /* 移除底部区域的白色背景 */
        .cbcaa82c {
            background-color: transparent !important;
        }
        
        /* 应用背景色到所有主要容器 */
        .ds-theme, page, main, .main-container, .chat-container, .conversation-container {
            background-color: ${settings.bgColor || '#ffffff'} !important;
        }
        
        /* 侧边栏样式 */
        .sidebar, nav, [class*="sidebar"], [class*="nav-"], [class*="side-"] {
            background-color: ${settings.sidebarColor || '#f5f5f5'} !important;
            --dsr-side-bg: ${settings.sidebarColor || '#f5f5f5'} !important;
            --dsr-side-hover-bg-rgb: ${settings.sidebarColor ? settings.sidebarColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') : '245, 245, 245'} !important;
            --dsr-side-hover-bg: ${settings.sidebarColor || '#f5f5f5'} !important;
        }

        /* 聊天输入框底板样式 */
        .chat-input-panel, [class*="input-panel"], [class*="chat-input"] {
            background-color: var(--dsr-input-bg) !important;
        }
        
        /* 字体设置 */
        * {
            font-family: ${settings.fontFamily || 'system-ui'} !important;
        }
        
        /* 保持CSS变量系统 */
        body {
            --dsr-bg: ${settings.bgColor || '#ffffff'} !important;
            --ds-rgb-bg-base: ${settings.bgColor ? settings.bgColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(' ') : '255 255 255'} !important;
            --dsr-side-bg: ${settings.sidebarColor || '#f5f5f5'} !important;
            --dsr-input-bg: ${settings.inputBgColor || 'rgb(243 244 246)'} !important;
        }
        
        /* 隐藏不需要的元素 */
        .intercom-lightweight-app,
        .intercom-lightweight-app-launcher,
        .intercom-lightweight-app-gradient {
            display: none !important;
        }

        p {
            color: ${settings.answerFontColor || '#ffffff'}!important;
        }

        h3 {
            color: ${settings.answerFontColor || '#ffffff'}!important;
        }

         h4 {
            color: ${settings.answerFontColor || '#ffffff'}!important;
        }

        .fbb737a4 {
            color: ${settings.questionFontColor || '#ffffff'}!important;
        }
    `;

    // 背景图片样式
    if (settings.bgImage !== undefined) {
        if (settings.bgImage) {
            console.log('尝试加载背景图片:', settings.bgImage);
            const img = new Image();
            img.onload = () => {
                console.log('背景图片加载成功');
                styles += `
                    .a5cd95be {
                        background-image: url('${settings.bgImage}') !important;
                        background-size: ${settings.bgImageMode || 'cover'} !important;
                        background-position: center !important;
                        background-repeat: ${settings.bgImageMode === 'repeat' ? 'repeat' : 'no-repeat'} !important;
                    }
                `;
                styleEl.textContent = styles;
            };
            img.onerror = () => {
                console.error('背景图片加载失败，尝试添加时间戳重试:', settings.bgImage);
                const retryUrl = settings.bgImage.includes('?') ?
                    `${settings.bgImage}&t=${new Date().getTime()}` :
                    `${settings.bgImage}?t=${new Date().getTime()}`;

                const retryImg = new Image();
                retryImg.onload = () => {
                    console.log('背景图片重试加载成功:', retryUrl);
                    styles += `
                        .a5cd95be {
                            background-image: url('${retryUrl}') !important;
                            background-size: ${settings.bgImageMode || 'cover'} !important;
                            background-position: center !important;
                            background-repeat: ${settings.bgImageMode === 'repeat' ? 'repeat' : 'no-repeat'} !important;
                        }
                    `;
                    styleEl.textContent = styles;

                    chrome.storage.local.get(['bgImage'], function (result) {
                        if (result.bgImage === settings.bgImage) {
                            chrome.storage.local.set({ bgImage: retryUrl });
                        }
                    });
                };
                retryImg.onerror = () => {
                    console.error('背景图片重试加载失败:', retryUrl);
                    styles += `
                        .a5cd95be {
                            background-image: none !important;
                            background-color: ${settings.bgColor || '#ffffff'} !important;
                        }
                    `;
                    styleEl.textContent = styles;

                    if (chrome.runtime && chrome.runtime.sendMessage) {
                        chrome.runtime.sendMessage({
                            type: 'bgImageLoadError',
                            url: settings.bgImage
                        });
                    }
                };
                retryImg.src = retryUrl;
            };
            img.src = settings.bgImage;
        } else {
            console.log('清除背景图片');
            styles += `
                .a5cd95be {
                    background-image: none !important;
                    background-color: ${settings.bgColor || '#ffffff'} !important;
                }
            `;
            styleEl.textContent = styles;
        }
    } else {
        styleEl.textContent = styles;
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateStyle') {
        if (message.settings) {
            // 处理重置所有设置的情况
            updateStyle(message.settings);
        } else {
            // 处理单个设置更新的情况
            chrome.storage.sync.get(setArr, function (settings) {
                settings[message.key] = message.value;
                updateStyle(settings);
            });
        }
    } else if (message.type === 'clearStyle') {
        // 清除所有样式
        let styleEl = document.getElementById('custom-deepseek-style');
        if (styleEl) {
            styleEl.textContent = '';
        }
        // 移除页面上的按钮
        const backButton = document.getElementById('back-to-question-button');
        const secondBackButton = document.getElementById('back-to-class-button');
        if (backButton) backButton.remove();
        if (secondBackButton) secondBackButton.remove();
    }
});

// 监听来自popup的消息，处理按钮显示控制
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleButtons') {
        const firstButton = document.getElementById('nav-to-first-button');
        const prevButton = document.getElementById('nav-to-prev-button');
        const nextButton = document.getElementById('nav-to-next-button');

        if (firstButton) {
            firstButton.style.display = message.value ? 'flex' : 'none';
        }
        if (prevButton) {
            prevButton.style.display = message.value ? 'flex' : 'none';
        }
        if (nextButton) {
            nextButton.style.display = message.value ? 'flex' : 'none';
        }
    }
});

// 确保样式在页面加载和动态内容更新时都能应用
function initializeStyles() {
    // 从sync存储中获取基本设置
    chrome.storage.sync.get(setArr, function (settings) {
        // 从local存储中获取图片数据
        chrome.storage.local.get(['bgImage'], function (localSettings) {
            // 合并两个存储的设置
            const mergedSettings = { ...settings, ...localSettings };
            updateStyle(mergedSettings);
        });
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initializeStyles);
// 确保在页面已经加载完成时也能正确初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeStyles();
}

// 监听动态内容变化
const observer = new MutationObserver(initializeStyles);
observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// 定义全局变量用于追踪元素位置
let currentIndex = -1;
let targetElements = [];

// 创建导航按钮的通用样式和行为
function createNavigationButton(id, text, position, clickHandler) {
    let button = document.getElementById(id);
    if (!button) {
        button = document.createElement('button');
        button.id = id;
        button.innerHTML = getButtonIcon(text);
        button.style.cssText = `
            position: fixed;
            ${position}
            width: 30px;
            height: 30px;
            background-color: #ffffff;
            color: #666666;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            z-index: 9999;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        `;

        // 动态设置按钮位置
        const targetElement = document.querySelector('.aaff8b8f');
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            button.style.top = `${rect.top - 40}px`;
        } else {
            button.style.top = '20px';
        }

        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });

        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        });

        button.addEventListener('click', clickHandler);

        document.body.appendChild(button);
        console.log(`${id} 按钮已创建并添加到页面`);
    }
    return button;
}

// 获取按钮图标
function getButtonIcon(text) {
    const icons = {
        '首': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14"/><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
        '上': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
        '下': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>'
    };
    return icons[text] || text;
}

// 显示提示信息
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${isError ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 123, 255, 0.1)'};
        color: ${isError ? '#ff0000' : '#0075ff'};
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out forwards;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -20px); }
            20% { opacity: 1; transform: translate(-50%, 0); }
            80% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);

    // 2秒后移除提示和样式
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 2000);
}

// 高亮显示目标元素
function highlightElement(element) {
    if (!element) return;

    // 添加视觉反馈
    element.style.transition = 'background-color 0.3s';
    element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    setTimeout(() => {
        element.style.backgroundColor = '';
    }, 1000);
}

// 创建第一个按钮 - 跳转到最上面的元素
function createFirstButton() {
    return createNavigationButton(
        'nav-to-first-button',
        '首',
        'right: 100px;',
        () => {
            try {
                console.log('首个元素按钮被点击');
                // 获取所有目标元素
                const elements = Array.from(document.getElementsByClassName('fbb737a4'));
                console.log('找到的fbb737a4元素数量:', elements.length);

                if (elements.length > 0) {
                    // 更新全局变量
                    targetElements = elements;
                    currentIndex = 0;

                    const targetElement = targetElements[currentIndex];
                    console.log('准备滚动到第一个元素');

                    // 滚动到目标元素
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });

                    highlightElement(targetElement);
                    console.log('滚动完成');
                } else {
                    console.log('没有找到目标元素');
                    showNotification('没有找到目标元素', true);
                }
            } catch (error) {
                console.error('首个元素按钮点击处理出错:', error);
                showNotification('操作失败，请刷新页面重试', true);
            }
        }
    );
}

// 创建第二个按钮 - 跳转到上一个元素
function createPrevButton() {
    return createNavigationButton(
        'nav-to-prev-button',
        '上',
        'right: 60px;',
        () => {
            try {
                console.log('上一个元素按钮被点击');
                // 获取所有目标元素
                const elements = Array.from(document.getElementsByClassName('fbb737a4'));
                console.log('找到的fbb737a4元素数量:', elements.length);

                if (elements.length > 0) {
                    // 更新目标元素数组
                    targetElements = elements;

                    // 如果是第一次点击或需要重新开始
                    if (currentIndex === -1) {
                        currentIndex = elements.length - 1;
                    } else {
                        // 移动到上一个元素
                        currentIndex = (currentIndex - 1 + elements.length) % elements.length;
                    }

                    const targetElement = targetElements[currentIndex];
                    console.log('准备滚动到元素，索引:', currentIndex);

                    // 滚动到目标元素
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });

                    highlightElement(targetElement);
                    console.log('滚动完成');
                } else {
                    console.log('没有找到目标元素');
                    showNotification('没有找到目标元素', true);
                }
            } catch (error) {
                console.error('上一个元素按钮点击处理出错:', error);
                showNotification('操作失败，请刷新页面重试', true);
            }
        }
    );
}

// 创建第三个按钮 - 跳转到下一个元素
function createNextButton() {
    return createNavigationButton(
        'nav-to-next-button',
        '下',
        'right: 20px;',
        () => {
            try {
                console.log('下一个元素按钮被点击');
                // 获取所有目标元素
                const elements = Array.from(document.getElementsByClassName('fbb737a4'));
                console.log('找到的fbb737a4元素数量:', elements.length);

                if (elements.length > 0) {
                    // 更新目标元素数组
                    targetElements = elements;

                    // 如果是第一次点击或需要重新开始
                    if (currentIndex === -1) {
                        currentIndex = 0;
                    } else {
                        // 移动到下一个元素
                        currentIndex = (currentIndex + 1) % elements.length;
                    }

                    const targetElement = targetElements[currentIndex];
                    console.log('准备滚动到元素，索引:', currentIndex);

                    // 滚动到目标元素
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });

                    highlightElement(targetElement);
                    console.log('滚动完成');
                } else {
                    console.log('没有找到目标元素');
                    showNotification('没有找到目标元素', true);
                }
            } catch (error) {
                console.error('下一个元素按钮点击处理出错:', error);
                showNotification('操作失败，请刷新页面重试', true);
            }
        }
    );
}

// 在页面加载和动态内容更新时创建按钮
document.addEventListener('DOMContentLoaded', () => {
    createFirstButton();
    createPrevButton();
    createNextButton();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createFirstButton();
    createPrevButton();
    createNextButton();
}

// 监听动态内容变化时重新创建按钮
const buttonObserver = new MutationObserver(() => {
    createFirstButton();
    createPrevButton();
    createNextButton();
});
buttonObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// 监听来自popup的消息，处理按钮显示控制
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleButtons') {
        const firstButton = document.getElementById('nav-to-first-button');
        const prevButton = document.getElementById('nav-to-prev-button');
        const nextButton = document.getElementById('nav-to-next-button');

        if (firstButton) {
            firstButton.style.display = message.value ? 'flex' : 'none';
        }
        if (prevButton) {
            prevButton.style.display = message.value ? 'flex' : 'none';
        }
        if (nextButton) {
            nextButton.style.display = message.value ? 'flex' : 'none';
        }
    }
});