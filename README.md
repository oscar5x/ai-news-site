# AI × 艺术 · 每日自动更新网站（零成本方案）

这是一个**不依赖 Manus** 的极简网站方案：
- 前端：完全静态（GitHub Pages 托管）。
- 数据：由 GitHub Actions **每天定时**抓取 RSS → 生成 `data/data.json`。
- 成本：0 元（GitHub 免费层）。

## 一键使用步骤
1. 在 GitHub 新建一个仓库（例如 `ai-news-site`），保持**公开**。
2. 把本项目所有文件上传到该仓库根目录。
3. 打开仓库的 **Settings → Pages**，选择 **GitHub Actions** 作为部署方式。
4. 打开 **Settings → Actions → General**，勾选 **Read and write permissions**。
5. 在 `.github/workflows/update-data.yml` 中，默认的定时任务是 **每天 19:00（北京时区）** 自动更新。
6. 提交后，进入 **Actions** 标签页，手动点一次 **Run workflow** 做首更。
7. 打开 GitHub Pages 提供的网址，就能看到每日更新站点。

## 修改 RSS 源
编辑 `data/feeds.json`，按如下结构：
```json
[
  {"url":"https://example.com/rss", "source":"Example", "category":"AI×艺术"},
  {"url":"https://another.com/feed.xml", "source":"Another", "category":"AI×教育"}
]
