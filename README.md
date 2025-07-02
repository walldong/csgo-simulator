# CSGO/CS2 Case Opening Simulator

本项目是一个高仿CSGO/CS2的武器箱开箱模拟器，基于 Next.js + React 实现，支持本地数据、真实概率、动画、磨损、稀有物品处理和本地库存系统。

## 主要功能

- 支持所有武器箱/纪念包/稀有物品的本地数据模拟开箱
- 真实还原CSGO/CS2开箱动画（滚动带、红线、稀有物品特殊处理）
- 稀有（金色）物品只在滚动带显示为问号，中奖后才揭晓具体物品
- 皮肤支持磨损（float）和磨损级别，概率与官方一致
- 本地库存系统，自动记录每次开箱获得的物品，支持分类、清空、统计
- 支持库存页面按箱子名称分组、页签切换
- 所有图片、数据均本地化，无需依赖外部API

## 目录结构

```
csgo-simulator/
├── components/         # 主要UI组件（PrizeCard, RollingRow, Modal等）
├── interfaces/         # TS类型定义
├── pages/              # Next.js页面（首页、箱子详情、库存页等）
├── public/
│   ├── crates.json     # 所有箱子/纪念包数据
│   ├── skins.json      # 所有皮肤/物品数据
│   └── images/         # 所有本地图片资源
├── scripts/            # 辅助脚本
├── utils/              # 工具函数
├── package.json
└── README.md
```

## 如何运行

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动开发环境：
   ```bash
   npm run dev
   ```
3. 访问 [http://localhost:3000](http://localhost:3000)

> **注意：** 项目所有数据和图片均为本地文件，首次clone建议检查public目录下资源是否齐全。

## 特色说明

- **动画还原**：滚动带动画、红线、稀有物品问号等细节高度还原CSGO/CS2体验。
- **概率与磨损**：所有物品按真实概率、磨损区间和概率分布生成。
- **稀有物品处理**：滚动带只显示金色问号，中奖后才揭晓具体物品。
- **库存系统**：本地localStorage自动记录所有开箱结果，支持分类、清空、统计。
- **数据本地化**：所有箱子、皮肤、图片均本地存储，离线可用。

## 常见问题

- **为什么有些皮肤没有磨损？**
  > 只有带有min_float/max_float字段的皮肤才会生成磨损。
- **如何清空库存？**
  > 进入"我的库存"页面，可清空全部或单个箱子的库存。
- **如何添加新箱子/皮肤？**
  > 只需在public/crates.json和skins.json中补充数据，并放置图片到public/images目录。

## 贡献与交流

如有建议、bug反馈或想要贡献代码，欢迎提issue或PR。

数据来源：https://github.com/ByMykel/CSGO-API
---

本项目仅供学习交流，严禁用于任何商业用途。
