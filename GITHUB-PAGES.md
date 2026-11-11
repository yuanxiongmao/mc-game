# 发布到 GitHub Pages

这是纯静态游戏，不需要服务器或构建步骤。页面及图片均使用相对路径，可直接部署到 GitHub Pages 的仓库子路径。

## 发布设置

在 GitHub 仓库中打开 Settings → Pages：

1. Source 选择 Deploy from a branch。
2. Branch 选择 main，目录选择 / (root)。
3. 点击 Save，等待部署完成。

网站地址以 GitHub Pages 设置页面实际显示的地址为准。更新 main 分支后会自动重新发布。

`.nojekyll` 用于直接发布静态文件。`sites/` 是旧 Sites 部署目录，`.tools/` 是本地工具目录，两者不上传至 GitHub。

## 本地检查

运行 `npm test` 检查游戏逻辑；运行 `npm start` 后访问 http://127.0.0.1:4173 检查页面。

浏览器存档按网站地址保存；旧 Sites 域名上的进度不会自动迁移到新域名。
