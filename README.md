# takahoshino.github.io

个人主页源码。纯静态实现（HTML + CSS + 原生 JavaScript），零依赖、零构建，
推送到 `main` 分支后由 GitHub Pages 直接发布。

- 线上地址：https://takahoshino.github.io/
- 设计方向：高密度信息图层 / 工业战术 UI / 编辑化海报排版
- 骨架色：白 · 近黑 · 冷灰；系统色：单一高亮 `#d9ff00`（只用于编号、状态、
  线条、图形标记和激活态，不做大面积铺色）
- 两套模式：`NEGATIVE`（黑底，默认）与 `POSITIVE`（白底），右上角切换并记忆选择
- **所有图形都由 CSS / SVG 手绘**，没有引用任何游戏素材、Logo、角色或图标

## 设计手法参考

视觉语言参考自方舟系列平面设计的公开设计分析
（<https://www.ignoredone.space/index.php/arknights_design/>），只借鉴方法、不使用素材：

| 手法 | 在本站的落地 |
| --- | --- |
| 巨型粗体标题 + 横向饱和色带穿过文字 | 首屏 `.hero-slice`，色带从标题下方穿过并在卡片后消失 |
| 大字后方的重复三角阵（半调纹理） | 首屏 `.tri-field`，铺在 `HOSHINO` 字形后方并向右侧渐隐 |
| 斜向高亮条切割版面 | 作品区 `.sec-bar`，从卡片后方斜穿而过 |
| 定位十字标（方框 + 圆心） | 首屏 `.reg-mark`，散布在版面边角 |
| 超大字被前景物体遮挡 | 线框立方体 `.wire-cube` 压在身份卡上、色带穿过卡片后方 |
| 左边缘竖排 Latin 边注 | `.edge-label`（`HOSHINO // PERSONAL ARCHIVE — EST.2022`） |
| `[代号] 拉丁副标题` 细框铭牌 | `.hero-plate`（`[HS-001] 个人档案 · PERSONAL ARCHIVE`） |
| 巨型幽灵字水印 | 每个区块标题后的 `.ghost`（WORKS / PROFILE / LOG / CONTACT） |
| 重复几何形 / V 形斜纹填充 | `.sec-rule` 的斜纹刻度线、`.corners` 的角标括号 |
| 装饰性分隔与编号标记 | `.sec-meta` 前的 `◆`、区块编号 `01–04`、`W-001` 文件号 |
| 高频小字标签与坐标读数 | 标签行、坐标轴、`.radar-legend` 的点线引导 |
| 色差描边（RGB 分离） | `.hero-title-en` 的 `text-shadow` 偏移 |

## 目录结构

```
.
├── index.html               # 页面主体（所有文案都在这里改）
├── 404.html                 # 404 页面
├── favicon.svg              # 站点图标
├── robots.txt / sitemap.xml # 搜索引擎相关
├── .nojekyll                # 让 GitHub Pages 跳过 Jekyll 处理
└── assets
    ├── css/style.css        # 样式系统：主题变量 + 网格 + 各区块组件
    ├── img/avatar.jpg       # 头像（已本地化，不依赖 GitHub CDN）
    ├── js/main.js           # 配色切换、时钟、滚动进度、导航高亮、入场动画、复制邮箱
    ├── js/hero3d.js         # 首屏 Three.js 场景（按需加载）
    └── vendor/three.module.min.js   # Three.js 本体（本地内置，不走 CDN）
```

## 本地预览

直接双击 `index.html` 即可（全部使用相对路径），也可以起本地服务器：

```bash
python -m http.server 8000     # 访问 http://localhost:8000
```

## 页面结构

| 编号 | 区块 | 锚点 | 内容 |
| --- | --- | --- | --- |
| — | 首屏主控台 | `#top` | 空间化三层结构，见下方 |
| 01 | WORK 作品 | `#work` | 4 个项目卡（编号 / 类型 / 年份 / 技术栈 / 状态条 / 生成式缩略图） |
| 02 | PROFILE 档案 | `#profile` | 系统参数面板 + 能力雷达（含数值图例）+ 12 格模块阵列 |
| 03 | LOG 日志 | `#log` | 5 条时间线记录（真实日期，取自 GitHub 仓库） |
| 04 | CONTACT 联络 | `#contact` | 终端式提交面板 + 联系方式列表 |

### 首屏：空间化主控台

首屏不是卡片列表，而是一个分层的可操作空间：

| 层 | 元素 | 实现 |
| --- | --- | --- |
| 背景层 | 弧形巨幕、凸起平台、透视地面网格 | `.stage` 内的 `.stage-wall` / `.stage-platform` / `.stage-floor`，用 `perspective` + `rotateX` 做等距视角 |
| 中景层 | HUD 状态条、代号标题、身份舱（头像 + 年限圆环 + 档案字段）、读数 | `.hud-strip` / `.hero-title` / `.pod` / `.hero-readout` |
| 前景层 | 6 块错落悬浮的功能面板 | `.console` 内 `.mod`，整组 `rotateY(-9deg) rotateX(3deg)`，单块用 `--z` / `--y` 做前后错落 |
| 底栏 | 系统状态条：焦点 / 最近更新 / 合作状态 / 邮箱 | `.statusbar` |

#### WebGL 空间层

首屏另有一层 Three.js 场景叠在 CSS 背景层之上：透视地面网格、粒子尘、右侧的悬浮线框核心（自转 + 轻微漂浮）。

- **按需加载**：只有「视口 ≥ 1024px + 支持 WebGL + 未开启减少动效」时，页面空闲后才动态 `import()`，不会拖慢首屏。
- **兜底**：不满足条件、加载失败或禁用 JS 时，CSS 的等距地面与平台照常显示（`.hero.has-3d` 控制两者切换）。
- **交互**：鼠标移动产生视差，滚动时相机后退，切换配色时线条颜色跟随主题，页面不可见或离屏时暂停渲染。
- **想关掉 3D**：删掉 `index.html` 末尾的「首屏 3D 引导」`<script type="module">` 即可，其余部分不受影响。
- 依赖只有 Three.js 本体，已内置在 `assets/vendor/`，不请求任何外部 CDN。

功能面板自带系统状态，映射关系：

- `ACTIVE` — WORKS / PROFILE / LOG / CONTACT，可点击进入
- `IN PROGRESS` — NOW，正在维护的项目
- `LOCKED` — NOTES，尚未开放的内容（虚线边框 + 锁图标，不隐藏）

滚动时首屏会轻微后退并淡出（`.console-grid` 上的 `transform`，由 `main.js` 按滚动比例驱动）。

## 常见修改

| 想改什么 | 改哪里 |
| --- | --- |
| 代号 / 身份 / 座右铭 | `index.html` 首屏的 `.hero-title`、`.hero-lead`、`.hero-motto` |
| 顶部状态标签 | 首屏 `.tag-row` 里的 `li.tag`（ID / ORIGIN / UPDATED） |
| 读数数字 | `.hero-readout` 中的 `data-count="10"`，改属性同时改显示文本 |
| 项目卡片 | 复制一个 `<article class="work-card ...">`；`work-card-lg` 控制跨 7 列还是 5 列 |
| 项目缩略图 | 由 CSS 生成，样式在 `style.css` 的 `.thumb-a` ~ `.thumb-d` |
| 参数面板字段 | `.param-list` 里的 `.param-row`（`dt` 是字段名，`dd` 是内容） |
| 能力雷达数值 | `index.html` 里 `.radar-shape` 的 `points` 与 `.radar-legend` 的数字（**自评数值，按需修改**） |
| 模块阵列 | `.modules` 里的 `li.module`，`is-on` 控制指示灯亮起 |
| 日志条目 | `.log` 里的 `li.log-item`（日期 / 编号 / 标题 / 说明 / 状态） |
| 邮箱与社交链接 | 全局搜索 `a3451894191@163.com` 与 `github.com/TakaHoshino` |
| 头像 | 已本地化为 `assets/img/avatar.jpg`（460px，约 29KB），不再依赖 GitHub 头像 CDN；换图直接替换该文件即可 |
| 高亮色 | `style.css` 顶部 `--acc` / `--acc-strong`（`--acc` 是填充色，`--acc-strong` 是浅底上的文字色） |
| 切角大小 | CSS 变量 `--cut`（大面板）与 `--cut-sm` |
| 强制默认黑底 | `<head>` 里的小脚本，把 `var theme = saved \|\| (...)` 改成 `var theme = saved \|\| "negative"` |

## 关于雷达图数值

面板上标了「自评 / SELF-ASSESSED」，里面 6 个维度（Kotlin / Compose / C# /
.NET·WPF / UI·UX / Tooling）的数值是占位用的自评分数，请按自己的实际情况调整：

1. 先改 `.radar-legend` 里的 6 个数字（方便自己对齐）；
2. 再按比例改 `.radar-shape` 的 `points`（六边形顶点，圆心 150,150，满值半径 110）。

## 发布

仓库 Settings → Pages，Source 选 `Deploy from a branch`，
分支 `main`、目录 `/ (root)`，保存后等一两分钟即可。

> 主页上公开展示的邮箱来自本机 git 配置，如果不想公开，把它换成别的联系方式。
