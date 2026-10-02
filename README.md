# takahoshino.github.io

个人主页源码。纯静态实现（HTML + CSS + 原生 JavaScript），零依赖、零构建，
推送到 `main` 分支后由 GitHub Pages 直接发布。

- 线上地址：https://takahoshino.github.io/
- 站点结构：个人主页（`/`）+ 项目详情页（`/wenku8reader/`、`/fuckets/`），
  共用同一套设计令牌与组件语言
- 设计方向：白色编辑化海报 / 高密度信息图层 / 工业战术 UI
- 骨架色：白 · 近黑 · 冷灰；系统色：单一高亮 `#53ff18`（只用于编号、状态、
  线条、图形标记和激活态，不做大面积铺色）
- 两套模式：`POSITIVE`（白底，默认）与 `NEGATIVE`（黑底），右上角切换并记忆选择
- **所有图形都由 CSS / SVG 手绘**，没有引用任何游戏素材、Logo、角色或图标

## 设计手法参考

视觉语言参考自方舟系列平面设计的公开设计分析
（<https://www.ignoredone.space/index.php/arknights_design/>），只借鉴方法、不使用素材：

| 手法 | 在本站的落地 |
| --- | --- |
| 巨大的两行粗体标题，一行描边、一行实心并点亮首字母 | 首屏 `.hero-name-line`（`.is-hollow` 描边 / `.is-solid em` 高亮） |
| 巨型字号后方的重复几何 / 半调纹理 | 区块标题后的 `.ghost` 描边水印 |
| 斜向高亮条切割版面 | 首屏 `.stage-diag`，一道细高光线斜穿版面 |
| 定位十字标、虚线标框、坐标读数 | 首屏 `.rail-mark-*` 与 `[01] LAYER_ALPHA` / `[03] X:031 · Y:204` 之类的小标签 |
| 2D 界面与 3D 物体分层穿插 | 首屏 Three.js 线框核心落在 `[01]` 标框内，UI 面板压在其上层 |
| 直角、切角面板与细边框 | `.case` / `.dossier` 的 `clip-path` 切角 + 1px 描边 |
| 左边缘竖排 Latin 边注 | `.edge-label`（`HOSHINO // PERSONAL ARCHIVE — EST.2022`） |
| `[编号] 小标签` 与状态条 | `.hero-id`、`.rail-label`、`.index-state` |
| 巨型幽灵字水印 | 每个区块标题后的 `.ghost`（WORKS / PROFILE / LOG / CONTACT） |
| 重复刻度线 / 细线网格 | `.sec-rule` 的刻度线、`.fx-grid` 的全局网格 |
| 装饰性分隔与编号标记 | `.sec-meta` 前的 `◆`、区块编号 `01–04`、`W-001` 文件号 |
| 高频小字标签与读数 | `.hero-readout`、`.hero-tags`、`.radar-legend` |

## 目录结构

```
.
├── index.html                 # 个人主页（所有文案都在这里改）
├── 404.html                   # 404 页面
├── wenku8reader/index.html    # 项目详情页：Wenku8Reader（FILE NO.001）
├── fuckets/index.html         # 项目详情页：FuckETS（FILE NO.002）
├── favicon.svg                # 站点图标
├── robots.txt / sitemap.xml   # 搜索引擎相关（新增页面记得补 sitemap）
├── .nojekyll                  # 让 GitHub Pages 跳过 Jekyll 处理
└── assets
    ├── css/style.css          # 共享设计系统：主题变量 + 网格 + 组件 + 项目页
    ├── css/home.css           # 首页专属层（首屏空间 + 作品档案墙 + 档案面板）
    ├── img/avatar.jpg         # 头像（已本地化，不依赖 GitHub CDN）
    ├── img/wenku8reader.png   # 分享图（只给 og:image 用，页面内不展示）
    ├── js/main.js             # 配色切换、时钟、滚动进度、导航高亮、入场动画、复制邮箱
    ├── js/hero3d.js           # 首屏 Three.js 场景（按需加载）
    ├── js/version-sync.js     # 项目页：从 GitHub 拉取版本 / 体积 / 星标等实时数据
    └── vendor/three.module.min.js   # Three.js 本体（本地内置，不走 CDN）
```

> `assets/` 下的 CSS / JS 在各页面里都带 `?v=` 版本号，改完记得一起递增（见下）。

## 本地预览

直接双击 `index.html` 即可（全部使用相对路径），也可以起本地服务器：

```bash
python -m http.server 8000     # 访问 http://localhost:8000
```

项目页要走目录地址（`http://localhost:8000/wenku8reader/`、`/fuckets/`），
它们的数据同步脚本在本地也会正常请求 GitHub 接口。

### 本地调试脚本

`.preview/`（已在 `.gitignore` 里）放了几个基于 DevTools 协议的小脚本，
用本机装好的 Chrome / Edge 做截图与回归检查：

```bash
node .preview/shot.mjs  http://localhost:8000/fuckets/ negative out.png 1440 900           # 整页截图
node .preview/shot.mjs  http://localhost:8000/fuckets/ positive hero.png 1440 900 "#top"   # 只截某个区块
node .preview/check.mjs http://localhost:8000/fuckets/ 1440                                # 控制台报错 / 加载失败 / 横向溢出
node .preview/eval.mjs  http://localhost:8000/fuckets/ 1440 expr.js                        # 在页面里执行一段表达式
```

设置 `PREVIEW_BROWSER` 可以换成别的 Chromium 浏览器，用来复核浏览器之间的渲染差异：

```powershell
$env:PREVIEW_BROWSER='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
```

## 页面结构

| 编号 | 区块 | 锚点 | 内容 |
| --- | --- | --- | --- |
| — | 首屏档案页 | `#top` | 编辑化海报 + 空间化背景，见下方 |
| 01 | WORK 作品 | `#work` | 4 张作品档案卡（编号 / 类型 / 年份 / 技术栈 / 状态条 / 生成式缩略图），2 大 2 小的错落网格 |
| 02 | PROFILE 档案 | `#profile` | 系统参数面板 + 能力雷达（含数值图例）+ 12 格模块阵列 |
| 03 | LOG 日志 | `#log` | 5 条时间线记录（真实日期，取自 GitHub 仓库） |
| 04 | CONTACT 联络 | `#contact` | 终端式提交面板 + 联系方式列表 |

### 首屏：档案海报

首屏不是卡片列表，而是一张可以读的档案海报，左侧是文字主体、右侧是坐标标记与身份节点：

| 区块 | 元素 | 实现 |
| --- | --- | --- |
| 背景层 | 细网格、柔和辉光、斜穿版面的高光线、十字标记 | `.stage` 内的 `.stage-grid` / `.stage-glow` / `.stage-diag` / `.stage-mark-*` |
| 文字主体 | 档案编号行、两行巨型代号（一行描边一行实心）、三行说明、标签组、读数、主行动 | `.hero-id` / `.hero-name-line` / `.hero-sub` / `.hero-tags` / `.hero-readout` / `.hero-cta` |
| 坐标标记 | `[01] LAYER_ALPHA` 虚线标框、绿色方块、`[03] X:031 · Y:204` 准星、`[04] RENDER_OK` | `.rail-mark-alpha` / `.rail-square` / `.rail-mark-coord` / `.rail-label-*` |
| 身份节点 | 头像卡（含年限圆环）、代号与 ID 说明 | `.rail-node`（`[02] NODE_ACTIVE`） |
| 系统索引 | 6 格功能入口与状态（ACTIVE / IN PROGRESS / LOCKED） | `.hero-index` 内 `.index-item` |
| 底栏 | 焦点 / 最近更新 / 合作状态 / 邮箱 | `.statusbar` |

#### WebGL 空间层

首屏另有一层 Three.js 场景叠在 CSS 背景层之上：透视地面网格、粒子尘、悬浮线框核心（自转 + 轻微漂浮）。
宽屏时核心正好落在 `[01] LAYER_ALPHA` 标框内；窄屏或不支持 WebGL 时由 CSS 的静态圆环兜底。

- **按需加载**：只有「视口 ≥ 1024px + 支持 WebGL + 未开启减少动效」时，页面空闲后才动态 `import()`，不会拖慢首屏。
- **兜底**：不满足条件、加载失败或禁用 JS 时，CSS 层与静态圆环照常显示（`.hero.has-3d` 控制两者切换）。
- **交互**：鼠标移动产生视差，滚动时相机后退，切换配色时线条颜色跟随主题，页面不可见或离屏时暂停渲染。
- **想关掉 3D**：删掉 `index.html` 末尾的「首屏 3D 引导」`<script type="module">` 即可，其余部分不受影响。
- 依赖只有 Three.js 本体，已内置在 `assets/vendor/`，不请求任何外部 CDN。

系统索引里的每个入口都带状态，映射关系：

- `ACTIVE` — WORKS / PROFILE / LOG / CONTACT，可点击进入
- `IN PROGRESS` — NOW，正在维护的项目
- `LOCKED` — NOTES，尚未开放的内容（降透明度 + 虚线，不隐藏）

滚动时首屏会轻微后退并淡出（`[data-camera]` 上的 `transform`，由 `main.js` 按滚动比例驱动）。

## 项目详情页

`/wenku8reader/`、`/fuckets/` 是结构相同的项目档案页，沿用主页的设计语言
（HUD 状态条 / 竖排边注 / 横向色带 / 细框卡组 / 幽灵字 / 时间线），一页讲清一个项目：

| 编号 | 区块 | 锚点 | 内容 |
| --- | --- | --- | --- |
| — | 首屏 | `#top` | 身份舱（文件号 / 平台 / 许可）+ 参数面板 + NOW 卡 + 底部状态条 |
| 01 | OVERVIEW 概览 | `#overview` | 项目说明 + 系统要求 + 使用流程表 |
| 02 | FEATURES 特性 | `#features` | 功能模块卡组（7 张，最后一张整行横向排版） |
| 03 | STACK 技术 | `#stack` | 技术实现，双列卡组 |
| 04 | RELEASES 版本 | `#changelog` | 版本记录时间线（内容取自仓库 Releases） |
| 05 | DOWNLOAD 下载 | `#download` | 终端式下载面板 + 渠道列表 |

样式全部复用同一份 `style.css`：第 14 节是主页首屏，**第 15 节起是项目页**
（`.proj-hero` / `.proj-media` / `.panel` / `.cap-*` / `.tbl` / `.codeblock`）。

### 加一个新的项目页

1. 复制 `fuckets/index.html` 到新目录（如 `newone/index.html`）；
2. 改 `<title>` / `meta` / JSON-LD、首屏文案，以及 `<html data-gh-repo="owner/repo">`；
3. 按需增删 `.cap-card`（功能卡）、`.log-item`（版本记录）、`.contact-item`（渠道）；
4. 主页 `index.html` 里对应作品卡的 `href` 指向新目录，并补进 `sitemap.xml`。

### 项目页实时数据

`assets/js/version-sync.js` 会读取 GitHub 公开接口，把页面上的版本号、发布日期、
安装包体积、下载量与仓库星标换成本文实时值：

| 锚点 | 数据 | 说明 |
| --- | --- | --- |
| `<html data-gh-repo="owner/repo">` | 仓库 | 页面声明仓库；没声明就完全不发请求（主页因此不受影响） |
| `data-gh="version"` | `tag_name` | 取自 `releases/latest`（**最新正式版**）；仓库还没发过正式版时退回最新一条 release |
| `data-gh="channel"` | 预发布标记 | 自动显示「（正式版）」或「（测试版）」 |
| `data-gh="date"` | `published_at` | 输出 `YYYY.MM.DD` |
| `data-gh="size"` | 安装包体积 | 默认取 `.apk`；可用 `data-gh-asset="framework-dependent"` 指定包名片段 |
| `data-gh="downloads"` | 下载次数 | 同上，按 `data-gh-asset` 取对应安装包 |
| `data-gh="stars" / "forks" / "issues"` | 仓库数据 | 同步写回 `data-count`，与主页的数字跳变动画兼容 |
| `data-gh="release-url"` | 该 release 页 | 用于「前往 Releases」等链接 |

- 结果按会话缓存 10 分钟（`sessionStorage`），刷新不会重复请求；
- 任何一步失败（断网 / 限流 / 浏览器不支持 `fetch`）都**静默保留 HTML 里的静态文案**，
  所以页面里写的默认值应与线上真实值一致（无脚本时降级显示的就是它）；
- 仓库内文档 / 示例这类链接用 `blob/HEAD/...`、`tree/HEAD/...`，
  默认分支改名后依然有效。

### 静态资源版本号

各页面引用的 CSS / JS 都带 `?v=` 版本号（当前 `?v=20261002e`）。
GitHub Pages 的静态资源会被浏览器缓存，如果出现「新版 HTML + 旧版 style.css」的混排，
页面会整体错乱（首屏标题被裁、参数逐字换行等）；换 URL 能强制重新拉取。

> **改完 `assets/` 下的 CSS / JS，记得把所有页面里的 `?v=` 同步递增**（例如 `20261002f`）。

## 常见修改

| 想改什么 | 改哪里 |
| --- | --- |
| 代号大字 / 副标题 | `index.html` 首屏的 `.hero-name-line`（`.is-hollow` 描边行、`.is-solid` 实心行）与 `.hero-sub` |
| 顶部状态标签 | 首屏 `.hud-strip` 里的 `li.hud-item`、`.hero-tags` 里的 `li.hero-tag` |
| 读数数字 | `.hero-readout` 中的 `data-count="10"`，改属性同时改显示文本 |
| 项目卡片 | 复制一个 `<article class="case ...">`；`case-wide` 控制跨 7 列还是 5 列 |
| 项目缩略图 | 由 CSS 生成，图形在 `home.css` 的 `.case-media` 与 `.case-bars` / `.case-pane` / `.case-ring` / `.case-cross` / `.case-plus` |
| 参数面板字段 | `.dossier-rows` 里的 `.dossier-row`（`dt` 是字段名，`dd` 是内容） |
| 能力雷达数值 | `index.html` 里 `.radar-shape` 的 `points` 与 `.radar-legend` 的数字（**自评数值，按需修改**） |
| 模块阵列 | `.modules` 里的 `li.module`，`is-on` 控制指示灯亮起 |
| 日志条目 | `.log` 里的 `li.log-item`（日期 / 编号 / 标题 / 说明 / 状态） |
| 邮箱与社交链接 | 全局搜索 `a3451894191@163.com` 与 `github.com/TakaHoshino` |
| 头像 | 已本地化为 `assets/img/avatar.jpg`（460px，约 29KB），不再依赖 GitHub 头像 CDN；换图直接替换该文件即可 |
| 新增项目页 | 见「项目详情页」一节：复制 `fuckets/index.html` 再改文案与 `data-gh-repo` |
| 项目页版本号 / 体积 / 星标 | 不用手改，`version-sync.js` 按 `data-gh` 锚点自动填充；静态文案只是降级兜底 |
| 静态资源版本号 | 各页面的 `style.css?v=` / `main.js?v=` / `version-sync.js?v=`，改完 `assets/` 就递增 |
| 高亮色 | `style.css` 顶部 `--acc` / `--acc-strong`（`--acc` 是填充色 `#53ff18`，`--acc-strong` 是浅底上的文字色） |
| 切角大小 | CSS 变量 `--cut`（大面板）与 `--cut-sm` |
| 默认配色 | `<head>` 里的小脚本只管「读回上次选择」；想固定默认值，直接改 `<html data-theme="...">` |
| 首页专属样式 | `assets/css/home.css`（`style.css` 是项目页共用的设计系统） |

## 关于雷达图数值

面板上标了「自评 / SELF-ASSESSED」，里面 6 个维度（Kotlin / Compose / C# /
.NET·WPF / UI·UX / Tooling）的数值是占位用的自评分数，请按自己的实际情况调整：

1. 先改 `.radar-legend` 里的 6 个数字（方便自己对齐）；
2. 再按比例改 `.radar-shape` 的 `points`（六边形顶点，圆心 150,150，满值半径 110）。

## 发布

仓库 Settings → Pages，Source 选 `Deploy from a branch`，
分支 `main`、目录 `/ (root)`，保存后等一两分钟即可。

> 主页上公开展示的邮箱来自本机 git 配置，如果不想公开，把它换成别的联系方式。
