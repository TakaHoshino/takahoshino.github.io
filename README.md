# takahoshino.github.io

个人主页源码。纯静态实现（HTML + CSS + 原生 JavaScript），没有构建步骤、没有依赖，
推送到 `main` 分支后由 GitHub Pages 直接发布。

- 线上地址：https://takahoshino.github.io/
- 视觉风格：黑 / 白 / 高亮黄的工业感 HUD —— 切角面板、扫描线、等宽字母标签、
  顶部状态栏与滚动信息条，灵感来自《明日方舟》的 UI 语言。
- 两套配色：`NEGATIVE`（黑底，默认）与 `POSITIVE`（白底），右上角按钮切换，
  选择会记在 localStorage 里。

## 目录结构

```
.
├── index.html               # 页面主体（所有文案都在这里改）
├── 404.html                 # 404 页面
├── favicon.svg              # 站点图标
├── robots.txt / sitemap.xml # 搜索引擎相关
├── .nojekyll                # 让 GitHub Pages 跳过 Jekyll 处理
└── assets
    ├── css/style.css        # 全部样式：主题变量 + 面板 / HUD / 卡片组件
    └── js/main.js           # 主题切换、时钟、滚动进度、导航高亮、入场动画、复制邮箱
```

## 本地预览

直接双击 `index.html` 就能看（用的都是相对路径），也可以起一个本地服务器：

```bash
python -m http.server 8000     # 然后访问 http://localhost:8000
```

## 页面对应关系

| 区块 | 锚点 | 内容 |
| --- | --- | --- |
| 00 首页 | `#top` | 名字、简介、两个按钮、三个数字 |
| 01 档案 | `#profile` | 自我介绍 + 四格数据 |
| 02 能力 | `#capability` | 三张技术能力面板 |
| 03 作品 | `#archive` | 项目卡片（FILE NO.xxx） |
| 04 通讯 | `#transmission` | 邮箱按钮与联系方式列表 |

## 常见修改

| 想改什么 | 改哪里 |
| --- | --- |
| 名字 / UID / 简介 | `index.html` 的 `<section id="top">`；右侧档案卡的 `op-rows` |
| 顶部信息条文字 | `index.html` 里 `.ticker` 的两段 `.ticker-group`（两段要改成一样） |
| 数字统计 | `data-count="10"` 这类属性，改完记得同步显示的数字 |
| 技能标签 | `.cap-card` 里的 `li.chip` |
| 新增项目 | 复制一个 `<article class="file-card corners">`，改 `FILE NO.` 与内容 |
| 邮箱 / 社交链接 | 全局搜索 `a3451894191@163.com` 与 `github.com/TakaHoshino` |
| 头像 | 当前用 GitHub 头像地址，可换成本地图片（如 `assets/img/avatar.png`） |
| 配色 | `assets/css/style.css` 顶部的 `:root`（NEGATIVE）与 `[data-theme="positive"]` |
| 切角大小 | CSS 变量 `--cut`（大面板）与 `--cut-sm`（小方块） |
| 强制默认黑底 | `index.html` 头部的小脚本里，把 `var theme = saved \|\| (...)` 改成 `var theme = saved \|\| "negative"` |

## 发布

仓库 Settings → Pages，Source 选 `Deploy from a branch`，
分支 `main`、目录 `/ (root)`，保存后等一两分钟即可。

> 主页上公开展示的邮箱来自本机 git 配置，如果不想公开，把它换成别的联系方式。
