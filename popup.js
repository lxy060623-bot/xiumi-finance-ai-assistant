// ========== 全局状态 ==========
let config = {};
const CONFIG_KEY = 'financeHelperConfig';
const SESSION_SECRET_KEY = 'financeHelperApiSecret';
const LOCAL_SECRET_KEY = 'financeHelperApiSecretLocal';
const DEFAULT_CONFIG = {
  fontSize: 15,
  lineHeight: 1.75,
  letterSpacing: 1,
  textIndent: true,
  titleColor: '#1a5490',
  textColor: '#333333',
  accentColor: '#c0392b',
  partStyle: 'numbered',
  autoImage: true,
  imageSource: 'bing',
  coverKeyword: '金融 城市 财经 插画',
  domesticKeyword: '央行 货币政策 人民币',
  liquidityKeyword: '流动性 利率 曲线 数据',
  internationalKeyword: '全球金融 美联储 油价 地球',
  customUrls: '',
  provider: 'openai-compatible',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  modelName: 'gpt-4o-mini',
  authType: 'bearer',
  secretStorage: 'session',
  maxTokens: 8000,
  temperature: 0.3,
  timeoutSeconds: 120,
  adaptiveThinking: true,
  enableFallbacks: true,
  customHeaders: '',
  editorSelector: '',
  debugMode: false
};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  bindEvents();
  bindTabs();
  updateProviderUI(false);
});

// ========== 配置读写 ==========
async function loadConfig() {
  const stored = await chrome.storage.local.get([CONFIG_KEY, LOCAL_SECRET_KEY]);
  const saved = stored[CONFIG_KEY] || {};
  let sessionSecret = '';
  try {
    sessionSecret = (await chrome.storage.session.get(SESSION_SECRET_KEY))[SESSION_SECRET_KEY] || '';
  } catch {}
  const legacySecret = saved.apiKey || '';
  if (legacySecret) {
    try { await chrome.storage.session.set({ [SESSION_SECRET_KEY]: legacySecret }); } catch {}
    delete saved.apiKey;
    await chrome.storage.local.set({ [CONFIG_KEY]: saved });
  }
  config = {
    ...DEFAULT_CONFIG,
    ...saved,
    apiKey: sessionSecret || stored[LOCAL_SECRET_KEY] || legacySecret
  };
  applyConfigToUI();
}

function applyConfigToUI() {
  document.getElementById('font-size').value = config.fontSize;
  document.getElementById('line-height').value = config.lineHeight;
  document.getElementById('letter-spacing').value = config.letterSpacing;
  document.getElementById('text-indent').checked = config.textIndent;
  document.getElementById('title-color').value = config.titleColor;
  document.getElementById('title-color-text').value = config.titleColor;
  document.getElementById('text-color').value = config.textColor;
  document.getElementById('text-color-text').value = config.textColor;
  document.getElementById('accent-color').value = config.accentColor;
  document.getElementById('accent-color-text').value = config.accentColor;
  document.getElementById('part-style').value = config.partStyle;
  document.getElementById('auto-image').checked = config.autoImage;
  document.getElementById('image-source').value = config.imageSource;
  document.getElementById('cover-keyword').value = config.coverKeyword;
  document.getElementById('domestic-keyword').value = config.domesticKeyword;
  document.getElementById('liquidity-keyword').value = config.liquidityKeyword;
  document.getElementById('international-keyword').value = config.internationalKeyword;
  document.getElementById('custom-urls').value = config.customUrls;
  document.getElementById('provider').value = config.provider;
  document.getElementById('api-url').value = config.apiUrl;
  document.getElementById('api-key').value = config.apiKey;
  document.getElementById('model-name').value = config.modelName;
  document.getElementById('auth-type').value = config.authType;
  document.getElementById('secret-storage').value = config.secretStorage;
  document.getElementById('max-tokens').value = config.maxTokens;
  document.getElementById('timeout-seconds').value = config.timeoutSeconds;
  document.getElementById('adaptive-thinking').checked = config.adaptiveThinking;
  document.getElementById('enable-fallbacks').checked = config.enableFallbacks;
  document.getElementById('custom-headers').value = config.customHeaders;
  document.getElementById('editor-selector').value = config.editorSelector;
  document.getElementById('debug-mode').checked = config.debugMode;
}

function collectConfigFromUI() {
  return {
    fontSize: parseInt(document.getElementById('font-size').value) || 15,
    lineHeight: parseFloat(document.getElementById('line-height').value) || 1.75,
    letterSpacing: parseFloat(document.getElementById('letter-spacing').value) || 1,
    textIndent: document.getElementById('text-indent').checked,
    titleColor: document.getElementById('title-color').value,
    textColor: document.getElementById('text-color').value,
    accentColor: document.getElementById('accent-color').value,
    partStyle: document.getElementById('part-style').value,
    autoImage: document.getElementById('auto-image').checked,
    imageSource: document.getElementById('image-source').value,
    coverKeyword: document.getElementById('cover-keyword').value,
    domesticKeyword: document.getElementById('domestic-keyword').value,
    liquidityKeyword: document.getElementById('liquidity-keyword').value,
    internationalKeyword: document.getElementById('international-keyword').value,
    customUrls: document.getElementById('custom-urls').value,
    provider: document.getElementById('provider').value,
    apiUrl: document.getElementById('api-url').value,
    apiKey: document.getElementById('api-key').value,
    modelName: document.getElementById('model-name').value,
    authType: document.getElementById('auth-type').value,
    secretStorage: document.getElementById('secret-storage').value,
    maxTokens: parseInt(document.getElementById('max-tokens').value) || 8000,
    temperature: config.temperature ?? 0.3,
    timeoutSeconds: parseInt(document.getElementById('timeout-seconds').value) || 120,
    adaptiveThinking: document.getElementById('adaptive-thinking').checked,
    enableFallbacks: document.getElementById('enable-fallbacks').checked,
    customHeaders: document.getElementById('custom-headers').value.trim(),
    editorSelector: document.getElementById('editor-selector').value,
    debugMode: document.getElementById('debug-mode').checked
  };
}

async function saveConfig() {
  config = collectConfigFromUI();
  const publicConfig = { ...config };
  delete publicConfig.apiKey;
  await chrome.storage.local.set({ [CONFIG_KEY]: publicConfig });
  await chrome.storage.local.remove(LOCAL_SECRET_KEY);
  try { await chrome.storage.session.remove(SESSION_SECRET_KEY); } catch {}

  if (config.secretStorage === 'local' && config.apiKey) {
    await chrome.storage.local.set({ [LOCAL_SECRET_KEY]: config.apiKey });
    showStatus('设置已保存；API Key 已明文保存在本机浏览器', 'info');
  } else if (config.secretStorage === 'session' && config.apiKey) {
    await chrome.storage.session.set({ [SESSION_SECRET_KEY]: config.apiKey });
    showStatus('设置已保存；API Key 仅保留到本次浏览器关闭', 'success');
  } else {
    showStatus('设置已保存；API Key 不会持久保存', 'success');
  }
}

// ========== Tab 切换 ==========
function bindTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // 颜色选择器联动
  ['title', 'text', 'accent'].forEach(prefix => {
    const colorInput = document.getElementById(prefix + '-color');
    const textInput = document.getElementById(prefix + '-color-text');
    colorInput.addEventListener('input', () => textInput.value = colorInput.value);
    textInput.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) colorInput.value = textInput.value;
    });
  });
}

// ========== 事件绑定 ==========
function bindEvents() {
  document.getElementById('btn-generate').addEventListener('click', generateContent);
  document.getElementById('btn-fill').addEventListener('click', fillToXiumi);
  document.getElementById('btn-copy').addEventListener('click', copyRichText);
  document.getElementById('btn-save').addEventListener('click', saveConfig);
  document.getElementById('btn-reset').addEventListener('click', resetConfig);
  document.getElementById('btn-preview-images').addEventListener('click', previewImages);
  document.getElementById('btn-test-api').addEventListener('click', testApiConnection);
  document.getElementById('provider').addEventListener('change', () => updateProviderUI(true));
}

async function resetConfig() {
  config = { ...DEFAULT_CONFIG };
  const publicConfig = { ...config };
  delete publicConfig.apiKey;
  await chrome.storage.local.set({ [CONFIG_KEY]: publicConfig });
  await chrome.storage.local.remove(LOCAL_SECRET_KEY);
  try { await chrome.storage.session.remove(SESSION_SECRET_KEY); } catch {}
  applyConfigToUI();
  updateProviderUI(false);
  showStatus('已恢复默认设置', 'info');
}

function updateProviderUI(applyDefaults) {
  const provider = document.getElementById('provider').value;
  document.querySelectorAll('.provider-anthropic').forEach(el => el.classList.toggle('is-hidden', provider !== 'anthropic'));
  document.querySelectorAll('.provider-openai').forEach(el => el.classList.toggle('is-hidden', provider === 'anthropic'));
  if (!applyDefaults) return;
  if (provider === 'anthropic') {
    document.getElementById('api-url').value = 'https://api.anthropic.com/v1/messages';
    document.getElementById('model-name').value = 'claude-opus-5';
    document.getElementById('api-key').placeholder = 'sk-ant-...';
  } else {
    document.getElementById('api-url').value = 'https://api.openai.com/v1/chat/completions';
    document.getElementById('model-name').value = 'gpt-4o-mini';
    document.getElementById('api-key').placeholder = 'sk-...';
  }
}

// ========== 生成内容 ==========
async function generateContent() {
  const period = document.getElementById('period').value.trim();
  if (!period) {
    showStatus('请输入资讯时间段', 'error');
    return;
  }

  showStatus('正在生成内容...', 'info');
  document.getElementById('btn-generate').disabled = true;

  try {
    config = collectConfigFromUI();
    const canCallWithoutKey = config.provider === 'openai-compatible' && config.authType === 'none';
    if (config.apiKey || canCallWithoutKey) {
      await ensureApiHostPermission(config.apiUrl);
      const content = await callLLM(period, document.getElementById('source-notes').value.trim());
      document.getElementById('article-content').value = content;
      document.getElementById('article-title').value = period + ' 金融资讯';
      showStatus('内容生成成功', 'success');
    } else {
      // 使用模板
      const content = getTemplateContent(period);
      document.getElementById('article-content').value = content;
      document.getElementById('article-title').value = period + ' 金融资讯';
      showStatus('已填充模板内容（配置API Key可自动生成）', 'info');
    }
  } catch (e) {
    showStatus('生成失败：' + e.message, 'error');
  } finally {
    document.getElementById('btn-generate').disabled = false;
  }
}

async function callLLM(period, sourceNotes) {
  const sourceSection = sourceNotes
    ? `\n以下是用户提供并需优先采用的参考素材：\n${sourceNotes}\n`
    : '\n用户没有提供参考素材。无法确认的实时事实必须标注“待核实”，不得虚构来源、数字或链接。\n';
  const prompt = `你是一名严谨的中文财经资讯编辑。请围绕“${period}”撰写一篇适合公众号发布的金融资讯汇总。
${sourceSection}
硬性要求：
1. 结构为引言 + 四个主题模块 + 总结，模块标题使用“Part.01”到“Part.04”。主题分别覆盖政策监管、金融服务、数智金融、资本市场，可根据实际事件优化名称。
2. 每个模块包含1至2个【小节标题】和对应正文；所有日期、金额、比例、机构名称必须可核验。
3. 每个小节末尾单独写“信息来源：机构或媒体｜原始链接”。没有真实链接时明确写“待核实”，禁止编造链接。
4. 每个模块给出一行“配图建议：主题关键词｜建议出处与许可”，优先政府官网或 Wikimedia Commons，禁止笼统写“来源于网络”。
5. 使用正式、简洁的中文，不提供投资建议，不输出 Markdown 代码块。
6. 末尾依次写：图片丨各模块已标注；编辑丨；审核丨。
请直接输出文章正文。`;

  const response = await chrome.runtime.sendMessage({ action: 'generateWithLLM', config, prompt });
  if (!response?.success) throw new Error(response?.message || '模型请求失败');
  return response.content;
}

async function testApiConnection() {
  const button = document.getElementById('btn-test-api');
  config = collectConfigFromUI();
  button.disabled = true;
  showStatus('正在测试接口...', 'info');
  try {
    await ensureApiHostPermission(config.apiUrl);
    const response = await chrome.runtime.sendMessage({ action: 'testLLM', config });
    if (!response?.success) throw new Error(response?.message || '连接失败');
    showStatus(`连接成功：${response.model || config.modelName}`, 'success');
  } catch (error) {
    showStatus('接口测试失败：' + error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function ensureApiHostPermission(apiUrl) {
  let url;
  try { url = new URL(apiUrl); } catch { throw new Error('API 地址格式不正确'); }
  const originPattern = `${url.protocol}//${url.host}/*`;
  const permissions = { origins: [originPattern] };
  if (await chrome.permissions.contains(permissions)) return;
  const granted = await chrome.permissions.request(permissions);
  if (!granted) throw new Error(`未获得接口域名访问权限：${url.origin}`);
}

function getTemplateContent(period) {
  return `${period} 金融资讯

【模板占位提示】以下内容仅用于展示排版结构，发布前必须根据权威来源逐项核实并替换。

${period}，国内货币政策延续适度宽松基调，金融监管持续强化，资本市场改革稳步推进；国际方面，全球央行政策路径分化，地缘局势影响大宗商品价格，市场在通胀与增长的权衡中震荡运行。

Part.01 国内金融要闻：政策定调与监管强化

【货币政策延续适度宽松】
中国人民银行近期召开工作会议，明确下一阶段将继续实施好适度宽松的货币政策，加大逆周期调节力度。会议提出综合运用多种货币政策工具，保持流动性充裕，引导金融机构大力支持实体经济有效融资需求。

会议强调，要完善短端利率调控机制，强化利率政策执行和监督，保持社会综合融资成本低位运行。同时扎实做好金融"五篇大文章"，加强对扩大内需、科技创新、中小微企业等重点领域的金融支持。

【金融监管持续强化】
金融监管部门持续推进严监管强监管，要求金融机构专注主业、合规经营。监管部门强调，要坚持问题导向，把严监管强监管的要求落实到监管工作的全过程、各环节，真正做到"长牙带刺"、有棱有角。

同时，监管部门督促各类金融机构加快改革转型、实现错位发展，多措并举营造良好行业生态，有效提升经济金融适配性。

Part.02 货币与流动性：精准调控与成本下行

【流动性保持合理充裕】
央行通过公开市场操作精准调控市场流动性，综合运用逆回购、中期借贷便利等工具，提供短、中、长期流动性。近期央行创新操作工具，增加隔夜逆回购操作品种，进一步提升流动性管理的精准度和有效性。

市场资金面总体平稳，货币市场利率围绕政策利率平稳运行。专家表示，若后续政府债券发行等因素阶段性扰动资金面，央行将综合运用各类工具加大流动性投放。

【社会融资成本持续下降】
数据显示，新发放贷款加权平均利率持续下行，社会综合融资成本保持在低位。央行通过深化利率市场化改革，完善市场化利率形成和传导机制，推动实体经济融资成本稳中有降。

同时，央行督促金融机构规范信贷市场经营行为，降低融资中间费用，切实减轻企业和居民的融资负担。

Part.03 国际金融要闻：政策分化与地缘博弈

【全球央行政策路径分化】
主要经济体央行货币政策出现分化。部分央行因通胀粘性仍存，维持高利率甚至释放加息信号；另一些央行则因经济增长压力，开始考虑降息或暂停紧缩。政策分化导致全球资本流动加剧，汇率市场波动加大。

美联储内部对政策路径存在分歧，部分官员担忧通胀回落不及预期，主张继续加息；另一些官员则认为经济增长放缓，应保持耐心。市场对美联储后续政策路径的预期反复变化。

【地缘局势影响大宗商品】
中东地缘局势持续紧张，影响全球能源供应预期。霍尔木兹海峡航运受限，国际油价维持高位震荡。美国能源信息署上调了全年原油价格预测，指出地缘冲突对能源市场的影响可能持续较长时间。

同时，全球供应链仍面临不确定性，大宗商品价格波动对各国通胀走势产生重要影响，成为央行政策决策的重要考量因素。

总体来看，${period}国内金融市场在政策呵护下保持稳健运行，实体经济融资环境持续改善；国际金融市场则在政策分化与地缘风险中维持高波动，需密切关注外部环境变化对国内市场的传导影响。

图片|请逐图标注实际出处、作者与许可
编辑|黄雨佳
审核|董晓红`;
}

// ========== 填充到秀米 ==========
async function fillToXiumi() {
  const title = document.getElementById('article-title').value.trim();
  const content = document.getElementById('article-content').value.trim();

  if (!content) {
    showStatus('请先生成或输入文章内容', 'error');
    return;
  }

  // 收集最新配置
  config = collectConfigFromUI();

  // 获取配图
  let images = [];
  if (config.autoImage) {
    showStatus('正在搜索配图...', 'info');
    try {
      images = await fetchImages();
    } catch (e) {
      console.warn('配图获取失败:', e);
    }
  }

  showStatus('正在填充到秀米...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('xiumi.us')) {
      showStatus('请在秀米编辑页面使用此功能', 'error');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'fillArticle',
      data: {
        title,
        content,
        config,
        images
      }
    });

    if (response && response.success) {
      showStatus('填充成功！请在秀米中检查效果', 'success');
    } else {
      showStatus('自动填充失败：' + (response?.message || '未知错误') + '；可改用“复制富文本”', 'error');
    }
  } catch (e) {
    showStatus('通信失败，请刷新秀米页面后重试：' + e.message, 'error');
  }
}

// ========== 复制富文本 ==========
async function copyRichText() {
  const title = document.getElementById('article-title').value.trim();
  const content = document.getElementById('article-content').value.trim();
  if (!content) {
    showStatus('请先生成或输入文章内容', 'error');
    return;
  }

  config = collectConfigFromUI();
  const html = buildHTML(title, content, config);

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([content], { type: 'text/plain' })
      })
    ]);
    showStatus('富文本已复制，可在秀米中直接粘贴', 'success');
  } catch (e) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showStatus('纯文本已复制（富文本复制受限）', 'info');
  }
}

function buildHTML(title, content, config) {
  const style = `font-size:${config.fontSize}px;line-height:${config.lineHeight};letter-spacing:${config.letterSpacing}px;color:${config.textColor};`;
  const indent = config.textIndent ? 'text-indent:2em;' : '';
  const titleStyle = `color:${config.titleColor};font-weight:bold;font-size:18px;`;

  let html = `<div style="${style}">`;
  if (title) html += `<h2 style="${titleStyle}text-align:center;">${escapeHTML(title)}</h2>`;

  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    const safeText = escapeHTML(trimmed);
    if (!trimmed) {
      html += '<p>&nbsp;</p>';
    } else if (trimmed.startsWith('Part.')) {
      html += `<h3 style="${titleStyle}margin-top:20px;">${safeText}</h3>`;
    } else if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
      html += `<p style="font-weight:bold;color:${config.titleColor};margin-top:12px;">${safeText}</p>`;
    } else if (/^(图片|编辑|审核)[|丨]/.test(trimmed)) {
      html += `<p style="font-size:12px;color:#999;">${safeText}</p>`;
    } else {
      html += `<p style="${indent}">${safeText}</p>`;
    }
  });

  html += '</div>';
  return html;
}

// ========== 配图搜索 ==========
async function fetchImages() {
  if (config.imageSource === 'custom' && config.customUrls) {
    return config.customUrls.split('\n').map(sanitizeHttpUrl).filter(Boolean);
  }

  // 调用background搜索必应图片
  const keywords = [
    config.coverKeyword,
    config.domesticKeyword,
    config.liquidityKeyword,
    config.internationalKeyword
  ];

  const results = await chrome.runtime.sendMessage({
    action: 'searchImages',
    keywords
  });

  if (!results?.success) throw new Error(results?.message || '图片搜索失败');
  return results.images || [];
}

async function previewImages() {
  config = collectConfigFromUI();
  const previewDiv = document.getElementById('image-preview');
  previewDiv.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">正在搜索...</p>';

  try {
    const images = await fetchImages();
    if (!images.length) {
      previewDiv.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">未找到图片</p>';
      return;
    }

    const labels = ['封面', '国内', '流动性', '国际'];
    previewDiv.innerHTML = images.slice(0, 4).map((url, i) => `
      <div>
        <img src="${escapeHTML(sanitizeHttpUrl(url))}" alt="配图${i + 1}" onerror="this.style.display='none'">
        <div class="img-label">${labels[i] || '配图' + (i + 1)}</div>
      </div>
    `).join('');
  } catch (e) {
    previewDiv.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#c62828;">搜索失败：' + e.message + '</p>';
  }
}

// ========== 工具函数 ==========
function showStatus(msg, type = 'info') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status show ' + type;
  setTimeout(() => el.classList.remove('show'), 4000);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function sanitizeHttpUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
