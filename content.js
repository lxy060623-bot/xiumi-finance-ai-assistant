// ========== 秀米金融资讯助手 - Content Script ==========

let debugMode = false;

function log(...args) {
  if (debugMode) console.log('[秀米助手]', ...args);
}

// ========== 消息监听 ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('收到消息:', request.action);

  if (request.action === 'fillArticle') {
    debugMode = request.data.config?.debugMode || false;
    fillArticle(request.data)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => {
        console.error('[秀米助手] 填充失败:', err);
        sendResponse({ success: false, message: err.message });
      });
    return true; // 异步响应
  }

  if (request.action === 'ping') {
    sendResponse({ success: true, ready: true });
    return true;
  }
});

// ========== 主填充逻辑 ==========
async function fillArticle({ title, content, config, images }) {
  config = normalizeStyleConfig(config || {});
  log('开始填充文章，配置:', config);

  // 1. 定位编辑区
  const editor = findEditor(config.editorSelector);
  if (!editor) {
    throw new Error('未找到秀米编辑区，请确认已进入文章编辑页面');
  }
  log('找到编辑区:', editor);

  // 2. 清空现有内容（可选，先聚焦到末尾）
  await focusEditor(editor);

  // 3. 解析内容结构
  const blocks = parseContent(content, title);
  log('解析出内容块:', blocks.length, '个');

  // 4. 逐块填充
  let imageIndex = 0;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    await insertBlock(editor, block, config);

    // 在Part分区后插入配图
    if (config.autoImage && block.type === 'part' && images && images[imageIndex]) {
      await new Promise(r => setTimeout(r, 300));
      await insertImage(editor, images[imageIndex], config);
      imageIndex++;
    }

    await new Promise(r => setTimeout(r, 150));
  }

  // 封面图插入到最前面
  if (config.autoImage && images && images.length > 0) {
    await insertCoverImage(editor, images[0], config);
  }

  return { blocks: blocks.length, images: imageIndex };
}

// ========== 定位编辑区 ==========
function findEditor(customSelector) {
  // 1. 用户自定义选择器
  if (customSelector) {
    const el = document.querySelector(customSelector);
    if (el) return el;
  }

  // 2. 常见秀米编辑区选择器
  const selectors = [
    '#editor[contenteditable="true"]',
    '.editor[contenteditable="true"]',
    '.xiumi-editor[contenteditable="true"]',
    '.edit-area[contenteditable="true"]',
    '.article-editor[contenteditable="true"]',
    '#js_editor[contenteditable="true"]',
    '.editor-container [contenteditable]',
    '.preview-area [contenteditable]'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null && el.offsetWidth * el.offsetHeight > 10000) {
      log('通过选择器找到编辑区:', sel);
      return el;
    }
  }

  // 3. 查找最大的contenteditable元素
  const editables = document.querySelectorAll('[contenteditable="true"]');
  let largest = null;
  let maxArea = 0;
  editables.forEach(el => {
    const area = el.offsetWidth * el.offsetHeight;
    if (area > maxArea && area > 10000) {
      maxArea = area;
      largest = el;
    }
  });

  if (largest) {
    log('通过最大contenteditable找到编辑区');
    return largest;
  }

  // 4. 查找iframe中的编辑区
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const innerEditor = iframeDoc.querySelector('[contenteditable="true"], #editor, .editor');
      if (innerEditor) {
        log('在iframe中找到编辑区');
        return innerEditor;
      }
    } catch (e) {
      // 跨域iframe无法访问
    }
  }

  return null;
}

// ========== 聚焦编辑区 ==========
async function focusEditor(editor) {
  editor.focus();
  // 移动光标到末尾
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  await new Promise(r => setTimeout(r, 100));
}

// ========== 解析内容结构 ==========
function parseContent(content, title) {
  const blocks = [];
  const lines = content.split('\n');

  // 标题
  if (title) {
    blocks.push({ type: 'title', text: title });
  }

  let currentParagraph = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentParagraph.length) {
        blocks.push({ type: 'paragraph', text: currentParagraph.join('') });
        currentParagraph = [];
      }
      continue;
    }

    // Part分区标题
    if (trimmed.match(/^Part\.\d+/i)) {
      if (currentParagraph.length) {
        blocks.push({ type: 'paragraph', text: currentParagraph.join('') });
        currentParagraph = [];
      }
      blocks.push({ type: 'part', text: trimmed });
      continue;
    }

    // 小节标题（【】包裹）
    if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
      if (currentParagraph.length) {
        blocks.push({ type: 'paragraph', text: currentParagraph.join('') });
        currentParagraph = [];
      }
      blocks.push({ type: 'subtitle', text: trimmed });
      continue;
    }

    // 落款
    if (/^(图片|编辑|审核)[|丨]/.test(trimmed)) {
      if (currentParagraph.length) {
        blocks.push({ type: 'paragraph', text: currentParagraph.join('') });
        currentParagraph = [];
      }
      blocks.push({ type: 'footer', text: trimmed });
      continue;
    }

    // 普通段落（累积多行）
    currentParagraph.push(trimmed);
  }

  if (currentParagraph.length) {
    blocks.push({ type: 'paragraph', text: currentParagraph.join('') });
  }

  return blocks;
}

// ========== 插入内容块 ==========
async function insertBlock(editor, block, config) {
  switch (block.type) {
    case 'title':
      await insertTitle(editor, block.text, config);
      break;
    case 'part':
      await insertPartTitle(editor, block.text, config);
      break;
    case 'subtitle':
      await insertSubtitle(editor, block.text, config);
      break;
    case 'paragraph':
      await insertParagraph(editor, block.text, config);
      break;
    case 'footer':
      await insertFooter(editor, block.text, config);
      break;
  }
}

// ========== 通过execCommand插入文本 ==========
function insertTextAtCursor(text) {
  editorFocusCheck();
  document.execCommand('insertText', false, text);
}

function insertHTMLAtCursor(html) {
  editorFocusCheck();
  if (!document.execCommand('insertHTML', false, html)) {
    const selection = window.getSelection();
    if (!selection?.rangeCount) throw new Error('无法定位秀米插入光标');
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = range.createContextualFragment(html);
    range.insertNode(fragment);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  document.activeElement?.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

function editorFocusCheck() {
  const active = document.activeElement;
  if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && !active.isContentEditable)) {
    // 尝试重新聚焦
    const editor = findEditor();
    if (editor) editor.focus();
  }
}

// ========== 插入标题 ==========
async function insertTitle(editor, text, config) {
  log('插入标题:', text);
  const html = `<p style="text-align:center;font-size:22px;font-weight:bold;color:${config.titleColor};margin:20px 0;">${escapeHTML(text)}</p>`;
  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 100));
}

// ========== 插入Part分区标题 ==========
async function insertPartTitle(editor, text, config) {
  log('插入Part标题:', text);
  let html = '';

  switch (config.partStyle) {
    case 'colored':
      html = `<p style="background:${config.titleColor};color:white;padding:8px 12px;border-radius:4px;font-weight:bold;font-size:16px;margin:24px 0 12px;">${escapeHTML(text)}</p>`;
      break;
    case 'underline':
      html = `<p style="font-size:17px;font-weight:bold;color:${config.titleColor};border-bottom:2px solid ${config.titleColor};padding-bottom:6px;margin:24px 0 12px;">${escapeHTML(text)}</p>`;
      break;
    case 'simple':
      html = `<p style="font-size:17px;font-weight:bold;color:${config.titleColor};margin:24px 0 12px;">${escapeHTML(text)}</p>`;
      break;
    case 'numbered':
    default:
      html = `<p style="font-size:17px;font-weight:bold;color:${config.titleColor};margin:24px 0 12px;border-left:4px solid ${config.titleColor};padding-left:10px;">${escapeHTML(text)}</p>`;
      break;
  }

  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 100));
}

// ========== 插入小节标题 ==========
async function insertSubtitle(editor, text, config) {
  log('插入小节标题:', text);
  const html = `<p style="font-weight:bold;color:${config.titleColor};font-size:${parseInt(config.fontSize) + 1}px;margin:16px 0 8px;">${escapeHTML(text)}</p>`;
  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 80));
}

// ========== 插入正文段落 ==========
async function insertParagraph(editor, text, config) {
  log('插入段落:', text.substring(0, 30) + '...');
  const indent = config.textIndent ? 'text-indent:2em;' : '';
  const html = `<p style="font-size:${config.fontSize}px;line-height:${config.lineHeight};letter-spacing:${config.letterSpacing}px;color:${config.textColor};${indent}margin:8px 0;">${highlightNumbers(text, config.accentColor)}</p>`;
  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 60));
}

// ========== 高亮数字（简单实现） ==========
function highlightNumbers(text, accentColor) {
  return escapeHTML(text);
}

// ========== 插入落款 ==========
async function insertFooter(editor, text, config) {
  log('插入落款:', text);
  const html = `<p style="font-size:12px;color:#999;text-align:right;margin:4px 0;">${escapeHTML(text)}</p>`;
  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 50));
}

// ========== 插入图片 ==========
async function insertImage(editor, imageUrl, config) {
  log('插入配图:', imageUrl);
  const safeUrl = sanitizeImageUrl(imageUrl);
  if (!safeUrl) return;
  const html = `<p style="text-align:center;margin:16px 0;"><img src="${escapeHTML(safeUrl)}" style="max-width:100%;border-radius:6px;" alt="配图"/></p>`;
  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 300));
}

// ========== 插入封面图 ==========
async function insertCoverImage(editor, imageUrl, config) {
  log('插入封面图:', imageUrl);
  const safeUrl = sanitizeImageUrl(imageUrl);
  if (!safeUrl) return;
  // 封面图插入到编辑区最前面
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const html = `<p style="text-align:center;margin:0 0 20px;"><img src="${escapeHTML(safeUrl)}" style="width:100%;border-radius:8px;" alt="封面"/></p>`;
  insertHTMLAtCursor(html);
  await new Promise(r => setTimeout(r, 300));

  // 重新聚焦到末尾
  await focusEditor(editor);
}

function normalizeStyleConfig(raw) {
  const clamp = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#333333';
  return {
    ...raw,
    fontSize: clamp(raw.fontSize, 12, 20, 15),
    lineHeight: clamp(raw.lineHeight, 1, 3, 1.75),
    letterSpacing: clamp(raw.letterSpacing, 0, 5, 1),
    titleColor: color(raw.titleColor || '#1a5490'),
    textColor: color(raw.textColor || '#333333'),
    accentColor: color(raw.accentColor || '#c0392b'),
    partStyle: ['numbered', 'colored', 'underline', 'simple'].includes(raw.partStyle) ? raw.partStyle : 'numbered'
  };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function sanitizeImageUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}

// ========== 页面加载完成提示 ==========
if (document.readyState === 'complete') {
  initFloatingPanel();
} else {
  window.addEventListener('load', initFloatingPanel);
}

function initFloatingPanel() {
  // 检测是否在秀米编辑页
  if (!window.location.href.includes('xiumi.us')) return;

  log('秀米金融资讯助手已加载');

  // 创建浮动提示按钮
  const panel = document.createElement('div');
  panel.id = 'xiumi-helper-panel';
  panel.innerHTML = `
    <div class="xiumi-helper-btn" title="秀米金融资讯助手">📊</div>
  `;
  panel.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 80px;
    z-index: 99999;
    font-size: 24px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  `;
  panel.addEventListener('mouseenter', () => panel.style.opacity = '1');
  panel.addEventListener('mouseleave', () => panel.style.opacity = '0.7');
  panel.addEventListener('click', () => {
    alert('秀米金融资讯助手已就绪！\n\n请点击浏览器右上角的插件图标，生成内容后点击「填充到秀米」。');
  });

  document.body.appendChild(panel);
}
