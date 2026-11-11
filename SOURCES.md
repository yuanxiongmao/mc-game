# 数据来源与生成规则

数据范围固定为 Minecraft Java Edition **26.3 正式版**，核对日期为 2026-10-19。游玩不需要联网。

本文描述原始数据层。当前游戏将全部 1286 个原始注册项通过 `catalog.js` 归并为 342 个类别，使用组内汇总属性，而非逐个变体选题。天然石材按石种独立，磨制及平滑石等加工形态另列为“加工石材”。细分历史版本仍保留在原始文件供核查，界面使用 `version-groups.js` 转换后的主版本分类。

盆栽注册项保留在所属植物的成员和名称别名中，以确保原始数据可追溯，但不贡献植物的汇总属性。雕纹、墙挂及铜氧化/涂蜡通过 `baseVariant()` 归回基础形态。主世界花卉列表参考已保存的方块页面与 Flowers 分类，排除末地紫颂花；珊瑚的活体和失活变种均按三种形态合并。

## 来源

| 数据 | 上游来源 | 本地原始文件 |
| --- | --- | --- |
| 正式版编号及版本发布时间 | [Mojang 官方版本清单](https://piston-meta.mojang.com/mc/game/version_manifest_v2.json) | `sources/manifest.json`、`version-26.3.json` |
| 26.3 的 1286 个方块 ID | [misode/mcmeta 的 26.3 注册表](https://github.com/misode/mcmeta/tree/26.3-registries) | `sources/registry-26.3.json` |
| 官方简体中文名 | Mojang 26.3 资源索引指向的 `minecraft/lang/zh_cn.json`，由官方资源服务器下载 | `sources/asset-index.json`、`zh_cn.json` |
| 英文名称 | [26.3 游戏资源](https://github.com/misode/mcmeta/tree/26.3-assets) | `sources/en_us.json` |
| 硬度、爆炸抗性、默认状态亮度、遮挡属性、物品关联及碰撞箱 | [mcbookshelf/mcdata](https://github.com/mcbookshelf/mcdata)，使用 `v1/26.3` 标签指向的提交 | `sources/bookshelf-tags.json`、`bookshelf-26.3.json` |
| 挖掘工具类别 | [RosegoldMC/minecraft-data.cr](https://github.com/RosegoldMC/minecraft-data.cr) 的 26.3 材料分类，辅助参考 [PrismarineJS/minecraft-data](https://github.com/PrismarineJS/minecraft-data) 的 26.1 数据 | `sources/rosegold-26.3.json`、`blocks-26.1.json` |
| 对应物品的堆叠上限 | [26.3 默认物品组件](https://github.com/misode/mcmeta/tree/26.3-summary/item_components) | `sources/item-components.json` |
| 可再生、燃烧及早期版本历史 | [Minecraft Wiki](https://minecraft.wiki/)，通过公开 MediaWiki API 读取方块页面原文 | `sources/wiki/batch-*.json`、`wiki-fire.txt` |
| 1.14 之后的方块 ID 变更历史 | [mcmeta registries 历史](https://github.com/misode/mcmeta/commits/registries/block/data.json) | `sources/registry-commits-*.json`、`registry-history/*.json` |
| 早期快照发布日期 | Minecraft Wiki 的对应 Java Edition 快照页 | `sources/wiki-snapshot-dates.json` |

上游文本、语言资源及数据保留其原作者权利，授权条件以对应仓库和 Wiki 的许可说明为准。Wiki 事实和历史经过提取、归类与修正；上表提供原文出处。

## 探索记录图片

全部 342 个类别均有本地图片映射，保存在 `block-images.js` 和 `sources/block-images.json`。图片位于 `assets/blocks/`，游玩时不向外部站点发起请求。

- 主要方块外观来自 [Webisso/minecraft-item-icons](https://github.com/Webisso/minecraft-item-icons)，具体资源路径及所用提交保存在 `sources/icon-tree.json` 和逐项图片映射中。
- 该图集未覆盖的普通模型来自 [Block Render](https://blockrender.dev/docs/blocks-and-items/) 的 Java 26.2 渲染服务，仅用于展示同名方块外观，不影响 26.3 的游戏属性数据。
- 特殊方块及新增方块的外观来自 [Minecraft Wiki](https://minecraft.wiki/)，逐项映射保留原图 URL 和对应页面，包括铜箱、铜傀儡像、置物架、菌架、稻草床、水、熔岩及传送门等。
- 空气、洞穴空气、虚空空气及移动中的活塞没有可见的独立外观，统一使用本项目绘制的虚线立方体示意图，并明确标注“无可见外观”。合并类别选用一个成员的图片并标注“代表外观”，属性仍按全部成员汇总。

Minecraft 原始视觉资源的权利属于 Mojang/Microsoft；上游图集及 Wiki 图片的许可与署名要求以各来源的说明为准。下载脚本为 `scripts/download-block-images.cjs` 和 `scripts/complete-block-images.cjs`；前者选择代表外观，后者补齐特殊方块的 Wiki 原图。

## 处理方式

1. 以 26.3 注册表为完整性基准，不只抽取生存模式可获得的物品；列表中的 1286 个 ID 与游戏题库逐个对应。
2. 通过游戏提取文件的 `default_properties` 找到默认方块状态，读取亮度和碰撞箱。没有对应物品时，堆叠值用 0 表示“不适用”。
3. 根据工具材料标签分类，不保留木镐、石镐、铁镐和钻石镐之间的等级差异。不可破坏方块单独显示“不可挖掘”。
4. 可再生属性优先读取 Wiki 的 Java 版信息，分组页的条件项由 `scripts/review-overrides.cjs` 显式指定；可燃和火焰传播根据 Wiki 火焰表、方块族及页面信息转成是/否。
5. 初始版本优先结合方块历史与注册表变更，针对改名、历史分组和实验内容做显式修正。23w07a 对应的 mcmeta 单个历史文件返回 404，因此该批加入的樱花、考古等内容采用 Wiki 已保存的历史条目核对。
6. 早期版本按开发阶段及具体编号比较；现代快照和正式版按官方/Wiki 记录的发布时间比较。同一天的早期快照缺少具体时刻时，使用快照字母次序区分。

`sources/overrides.json` 是人工核对覆盖结果，生成规则保存在 `scripts/review-overrides.cjs`。`sources/build-report.json` 保留自动提取遇到的条件项及采用的分组回退，最后的 `unresolved` 必须为空；它不代表这些回退未经覆盖修正。生成脚本会输出完整 `data.js`，不会在游玩时临时访问外部 API。

历史口径为“首次实际出现的方块形态”，不是第一次被提及、第一次出现纹理或当前英文 ID 第一次使用。例如哭泣的黑曜石为 `20w09a`，而不是仅加入纹理的 Beta 1.3；铁链沿用改名前 chain 的 `20w16a`。方块状态拆分为注册项时，历史形态可以早于当前 ID。

## 验证

当前玩法另有 `tests/catalog.test.cjs` 检查每个原始方块恰好属于一个类别，所有木种和颜色别名均能识别。组内布尔特性不同时标为“部分”，工具取并集，数值使用范围；爆炸抗性和硬度按范围中点比较方向，中点相同不提示方向。`scripts/build-version-groups.cjs` 使用已保存的 Wiki 历史父版本（`sources/version-parents.json`）归类快照，实验特性中的明确更新目标优先，避免把 1.17 快照误分到同期发布的 1.16 补丁。

- 1286 个方块与 26.3 注册表集合完全一致，且无重复中文名称或 ID。
- 每个方块都具有 11 项比较属性、中文名称及可排序的版本。
- 版本排序覆盖 rd、Classic、Indev、Infdev、Alpha、Beta、传统快照和 26.x 快照；硬度排序覆盖不可破坏方块。
- 浏览器检查覆盖无候选提示、自动匹配、重复提交计数、回车直提交、原始输入显示、猜中结束、存档恢复和手机布局。

这些检查验证题库完整性和应用行为；未逐个启动全部历史 Minecraft 版本进行实测。属性、版本原文及修正规则保留在工作目录中，便于后续校正和更新。
