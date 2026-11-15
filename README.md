# 西游X v0.8.8 · 2026-11-15

西游题材水墨动作与塔防游戏。本仓库是 r58 的完整网页运行包，保留现有存档，默认进入标准模式，无需登录即可游玩。

- [开始游戏](https://nisen0808-web.github.io/xiyou-td-play/)：默认分块加载入口。
- [完整入口](https://nisen0808-web.github.io/xiyou-td-play/index-full.html)：适合对比分块加载表现；仍需同目录资源。
- [下载当前运行包 ZIP](https://github.com/nisen0808-web/xiyou-td-play/archive/refs/heads/main.zip)。固定提交下载链接随本次交付提供。
- [本次源码提交](https://github.com/nisen0808-web/xiyou-td/commit/e256a72cfef0b6b2fa6163a0079b4b385f813553)（私有源码仓库）。
- [发布说明](RELEASE_NOTES.md)与[运行文件 SHA-256 清单](PUBLIC_BUILD.json)。

`index.html`、`index-split.html`、`xiyou-survivors.html` 字节相同。部署或解压游玩时，请保留 `assets/`、`chunks/`、`js/`、`bossfight/`、`villain/`，并通过 HTTP 服务打开目录。只复制 HTML 会缺少运行资源。

本次修正涵盖角色与场景素材、行走和技能表现、阵亡和索敌、布阵、道具说明、战斗与菜单布局、牛魔王奖励和首屏加载。最终包通过 13 项构建检查、895 个 HTTP 文件逐一核对，以及桌面与短横屏两份新上下文的启动和入口点击检查。

仍未完成所有关卡各通关 5 次，本版不宣称全面验收或达到“8 分”。首开在低性能设备上仍可能停顿，高攻速悟空部分动作衔接、密集战斗遮挡和部分小屏布局仍需打磨；声音尚未完成主观听音验收。详细范围见发布说明。
