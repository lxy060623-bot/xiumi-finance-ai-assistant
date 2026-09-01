# 秀米金融资讯助手 2.0

一个不依赖 Codex 的 Manifest V3 浏览器扩展。安装后可在 Chrome 和 Microsoft Edge 中使用，支持：

- Claude 原生 Messages API
- OpenAI Chat Completions 兼容接口
- 第三方 API 网关及中转接口
- Ollama、LM Studio 等本机 OpenAI 兼容接口
- 金融资讯生成、四模块排版、富文本复制及秀米编辑区填充

> Claude.ai/Claude 订阅不等同于 Claude API。使用 Claude 原生接口需要 Anthropic API Key，或自行配置的兼容网关。

## Agent Skill：秀米金融资讯发布

仓库同时提供独立的 `xiumi-finance-publisher` Skill。它把金融资讯工作流从浏览器扩展中拆出，可供支持 `SKILL.md` 的智能体按需使用：

- 核验指定时间段的金融资讯、数字、日期与原始链接；
- 按参考期刊保持四个模块的编辑角色和排版层级；
- 为每个模块选择图片并记录作者、来源页和许可依据；
- 复制秀米模板后编辑，禁止覆盖原稿；
- 保存后重新打开核验，默认只存草稿、不发布；
- 使用内置脚本检查四模块、文章来源、图片出处和免责声明。

Skill 源码位于 [`skills/xiumi-finance-publisher`](skills/xiumi-finance-publisher)。它不保存 API Key，也不依赖本扩展；扩展仅作为无法直接控制秀米页面时的可选执行层。

### 安装 Skill

- **Codex**：将整个 `xiumi-finance-publisher` 文件夹复制到个人 Skills 目录，或通过 Codex 的 GitHub Skill 安装方式安装本仓库路径。
- **Claude Code**：个人安装到 `~/.claude/skills/xiumi-finance-publisher/`，项目安装到 `.claude/skills/xiumi-finance-publisher/`。
- **claude.ai**：在 Settings > Features 中上传 Skill 专用 ZIP。不同 Claude 使用界面的 Skill 不会自动同步，需要分别安装。

Claude 的目录与上传方式参见 [Anthropic Agent Skills 官方文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)。

调用示例：

```text
使用 $xiumi-finance-publisher，参考我打开的八月上旬模板，搜集八月下旬金融资讯，保留四个模块并复制成新秀米草稿；每条资讯和每张图片都要可追溯出处，不要覆盖原稿，也不要发布。
```

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

Skill 目录：

```text
skills/xiumi-finance-publisher/
├── SKILL.md
├── agents/openai.yaml
├── references/editorial-standard.md
├── references/xiumi-workflow.md
└── scripts/validate_finance_draft.py
```
