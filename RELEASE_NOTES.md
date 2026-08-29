# v2.0.0

首个跨浏览器、多模型正式版本。

## 主要更新

- 同一份 Manifest V3 扩展兼容 Chrome 与 Microsoft Edge。
- 新增 Claude 原生 Messages API 适配器。
- 支持 OpenAI Chat Completions 兼容接口、第三方网关和本地模型。
- 模型接口域名改为运行时按需授权。
- API Key 默认仅保存到当前浏览器会话。
- 模型请求移至后台 Service Worker，密钥不会注入秀米页面。
- 新增 API 连通性测试、参考素材输入、超时控制及错误详情。
- 增强内容和图片 URL 转义，降低页面注入风险。
- 自动填充不适用时可使用富文本复制方案。

## 安装包

`dist/xiumi-finance-ai-assistant-v2.0.0.zip`

解压后在 `chrome://extensions/` 或 `edge://extensions/` 中选择“加载已解压的扩展程序”。
