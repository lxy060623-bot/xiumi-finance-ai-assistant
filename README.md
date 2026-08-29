# 秀米金融资讯助手 2.0

一个不依赖 Codex 的 Manifest V3 浏览器扩展。安装后可在 Chrome 和 Microsoft Edge 中使用，支持：

- Claude 原生 Messages API
- OpenAI Chat Completions 兼容接口
- 第三方 API 网关及中转接口
- Ollama、LM Studio 等本机 OpenAI 兼容接口
- 金融资讯生成、四模块排版、富文本复制及秀米编辑区填充

> Claude.ai/Claude 订阅不等同于 Claude API。使用 Claude 原生接口需要 Anthropic API Key，或自行配置的兼容网关。

## 安装

### Chrome

1. 解压整个插件文件夹，安装后不要随意移动它。
2. 打开 `chrome://extensions/`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择包含 `manifest.json` 的 `xiumi-finance-helper-universal` 文件夹。
6. 将“秀米金融资讯助手”固定到工具栏。

### Microsoft Edge

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择包含 `manifest.json` 的插件文件夹。
5. 将扩展固定到工具栏。

Chrome 与 Edge 都基于 Chromium；本扩展使用两者共同支持的 Manifest V3 API，不需要两套代码。

## 配置模型

打开扩展的“设置”页，选择接口类型。

### Claude 原生接口

- 接口类型：`Claude 原生 Messages API`
- API 地址：`https://api.anthropic.com/v1/messages`
- 模型名称：默认 `claude-opus-5`，也可填写账号实际可用的 Claude 模型 ID
- API Key：Anthropic API Key

扩展会使用 Claude 原生请求格式及必要请求头，不会通过 OpenAI 兼容格式模拟 Claude。

### OpenAI 兼容接口

- API 地址：服务商提供的 Chat Completions 地址，通常以 `/v1/chat/completions` 结尾
- 模型名称：填写服务商提供的模型 ID
- 认证方式：Bearer、`x-api-key` 或无密钥
- 本机服务可使用 `http://localhost:端口/...` 或 `http://127.0.0.1:端口/...`

远程 HTTP 接口会被拒绝，远程服务必须使用 HTTPS。

## 权限与密钥安全

- 扩展只在秀米域名注入内容脚本。
- 模型接口域名不会在安装时全部授权；第一次测试或生成时，浏览器会单独询问该域名的访问权限。
- API 请求由扩展后台 Service Worker 发出，密钥不会注入秀米网页。
- 默认“仅本次浏览器会话”保存 API Key；关闭浏览器后清除。
- 选择“保存在本机浏览器”会明文保存密钥，只建议在个人电脑上使用。
- 扩展不包含远程 JavaScript，不使用 `eval`，适合 Chrome/Edge Manifest V3 加载和后续商店审核。

## 使用流程

1. 打开秀米图文编辑页。
2. 点击扩展图标。
3. 在“设置”中配置接口并点击“测试接口”。
4. 在“内容”中填写资讯时间段；可粘贴权威来源链接或已核实素材。
5. 点击“生成内容”。
6. 审核事实、数字、来源和图片许可。
7. 点击“填充到秀米”；若当前秀米模板不是单块编辑器，使用“复制富文本”后在秀米中粘贴。

模型生成的实时财经信息仍需人工核验。扩展提示模型标注来源和待核实项，但不能替代事实审查。

## 更新已有安装

1. 用新版文件覆盖旧插件文件夹，或加载新版文件夹。
2. 在扩展管理页点击“重新加载”。
3. 旧版保存在本地配置中的 API Key 会自动迁移到本次浏览器会话，并从普通配置中删除。

## 文件结构

```text
xiumi-finance-helper-universal/
├── manifest.json
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── content.css
└── icons/
```
