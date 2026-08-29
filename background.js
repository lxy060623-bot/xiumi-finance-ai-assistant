// 秀米金融资讯助手 2.0 - Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'searchImages') {
    searchAllImages(request.keywords || [])
      .then(images => sendResponse({ success: true, images }))
      .catch(error => sendResponse({ success: false, message: error.message, images: [] }));
    return true;
  }

  if (request.action === 'generateWithLLM' || request.action === 'testLLM') {
    handleLLMRequest(request)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, message: error.message }));
    return true;
  }
});

async function handleLLMRequest(request) {
  const config = normalizeLLMConfig(request.config || {});
  const prompt = request.action === 'testLLM'
    ? '只回复“连接成功”，不要输出其他内容。'
    : String(request.prompt || '').trim();
  if (!prompt) throw new Error('生成提示词不能为空');
  validateEndpoint(config.apiUrl);
  const result = config.provider === 'anthropic'
    ? await callAnthropic(config, prompt, request.action === 'testLLM')
    : await callOpenAICompatible(config, prompt, request.action === 'testLLM');
  if (!result.content) throw new Error('模型返回了空内容');
  return result;
}

function normalizeLLMConfig(raw) {
  const provider = raw.provider === 'anthropic' ? 'anthropic' : 'openai-compatible';
  const defaults = provider === 'anthropic'
    ? { apiUrl: 'https://api.anthropic.com/v1/messages', modelName: 'claude-opus-5' }
    : { apiUrl: 'https://api.openai.com/v1/chat/completions', modelName: 'gpt-4o-mini' };
  return {
    provider,
    apiUrl: String(raw.apiUrl || defaults.apiUrl).trim(),
    apiKey: String(raw.apiKey || '').trim(),
    modelName: String(raw.modelName || defaults.modelName).trim(),
    authType: ['bearer', 'x-api-key', 'none'].includes(raw.authType) ? raw.authType : 'bearer',
    maxTokens: clampNumber(raw.maxTokens, 256, 16000, 8000),
    temperature: clampNumber(raw.temperature, 0, 2, 0.3),
    timeoutSeconds: clampNumber(raw.timeoutSeconds, 10, 600, 120),
    adaptiveThinking: raw.adaptiveThinking !== false,
    enableFallbacks: raw.enableFallbacks !== false,
    customHeaders: parseCustomHeaders(raw.customHeaders)
  };
}

async function callAnthropic(config, prompt, isTest) {
  if (!config.apiKey) throw new Error('Claude API 需要 API Key');
  if (!config.modelName) throw new Error('请填写 Claude 模型名称');
  const headers = {
    ...config.customHeaders,
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
  const body = {
    model: config.modelName,
    max_tokens: isTest ? 64 : config.maxTokens,
    messages: [{ role: 'user', content: prompt }]
  };
  if (!isTest && config.adaptiveThinking) body.thinking = { type: 'adaptive' };
  if (config.enableFallbacks && ['claude-opus-5', 'claude-fable-5'].includes(config.modelName)) {
    headers['anthropic-beta'] = mergeBetaHeaders(headers['anthropic-beta'], 'server-side-fallback-2026-07-01');
    body.fallbacks = 'default';
  }
  const data = await fetchJSON(config.apiUrl, { method: 'POST', headers, body }, config.timeoutSeconds);
  if (data.stop_reason === 'refusal') {
    const explanation = data.stop_details?.explanation ? `：${data.stop_details.explanation}` : '';
    throw new Error(`Claude 拒绝了本次请求${explanation}`);
  }
  const content = Array.isArray(data.content)
    ? data.content.filter(block => block?.type === 'text').map(block => block.text || '').join('\n').trim()
    : '';
  return { content, provider: 'anthropic', model: data.model || config.modelName, usage: data.usage || null };
}

async function callOpenAICompatible(config, prompt, isTest) {
  if (!config.modelName) throw new Error('请填写模型名称');
  if (config.authType !== 'none' && !config.apiKey) throw new Error('当前认证方式需要 API Key');
  const headers = { ...config.customHeaders, 'Content-Type': 'application/json' };
  if (config.authType === 'bearer') headers.Authorization = `Bearer ${config.apiKey}`;
  if (config.authType === 'x-api-key') headers['x-api-key'] = config.apiKey;
  const body = {
    model: config.modelName,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: isTest ? 64 : config.maxTokens,
    temperature: isTest ? 0 : config.temperature
  };
  const data = await fetchJSON(config.apiUrl, { method: 'POST', headers, body }, config.timeoutSeconds);
  return {
    content: extractOpenAIText(data),
    provider: 'openai-compatible',
    model: data.model || config.modelName,
    usage: data.usage || null
  };
}

function extractOpenAIText(data) {
  const messageContent = data?.choices?.[0]?.message?.content;
  if (typeof messageContent === 'string') return messageContent.trim();
  if (Array.isArray(messageContent)) return messageContent.map(part => part?.text || part?.content || '').join('\n').trim();
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  if (Array.isArray(data?.output)) {
    return data.output.flatMap(item => item?.content || [])
      .map(part => part?.text || part?.output_text || '').join('\n').trim();
  }
  if (typeof data?.response === 'string') return data.response.trim();
  return '';
}

async function fetchJSON(url, options, timeoutSeconds) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: JSON.stringify(options.body),
      signal: controller.signal
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
    if (!response.ok) {
      const detail = data?.error?.message || data?.message || data?.error || raw || response.statusText;
      throw new Error(`API 请求失败（${response.status}）：${String(detail).slice(0, 500)}`);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`API 请求超时（${timeoutSeconds} 秒）`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateEndpoint(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('API 地址格式不正确'); }
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    throw new Error('远程 API 必须使用 HTTPS；HTTP 仅允许本机地址');
  }
}

function parseCustomHeaders(value) {
  if (!value) return {};
  let parsed;
  try { parsed = typeof value === 'string' ? JSON.parse(value) : value; }
  catch { throw new Error('自定义请求头必须是有效 JSON'); }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('自定义请求头必须是 JSON 对象');
  const blocked = new Set([
    'host', 'content-length', 'cookie', 'origin', 'referer', 'content-type',
    'authorization', 'x-api-key', 'anthropic-version', 'anthropic-beta',
    'anthropic-dangerous-direct-browser-access'
  ]);
  return Object.fromEntries(Object.entries(parsed)
    .filter(([key, val]) => !blocked.has(key.toLowerCase()) && typeof val === 'string'));
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function mergeBetaHeaders(current, required) {
  const values = String(current || '').split(',').map(v => v.trim()).filter(Boolean);
  if (!values.includes(required)) values.push(required);
  return values.join(',');
}

async function searchAllImages(keywords) {
  const results = [];
  for (const keyword of keywords) {
    try {
      const images = await searchBingImages(keyword, 1);
      results.push(images[0] || '');
    } catch { results.push(''); }
  }
  return results.filter(Boolean);
}

async function searchBingImages(keyword, count = 1) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(keyword)}&form=HDRSC2&first=1`;
  const response = await fetch(url, { headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error(`图片搜索失败（${response.status}）`);
  return parseBingImageResults(await response.text(), count);
}

function parseBingImageResults(html, count) {
  const urls = [];
  const mRegex = /m=\"({[^\"]+})\"/g;
  let match;
  while ((match = mRegex.exec(html)) !== null && urls.length < count) {
    try {
      const data = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
      if (isValidImageUrl(data.murl)) urls.push(data.murl);
    } catch {}
  }
  return urls;
}

function isValidImageUrl(url) {
  if (!/^https:\/\//i.test(url || '')) return false;
  if (/bing\.com|microsoft\.com|(?:icon|logo|spacer)/i.test(url)) return false;
  return true;
}

chrome.runtime.onInstalled.addListener(() => {
  const result = chrome.storage.session?.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
  result?.catch?.(() => {});
});
