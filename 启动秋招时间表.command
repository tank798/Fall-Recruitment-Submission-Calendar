#!/bin/zsh

set -e
setopt NO_BG_NICE
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，请先安装 Node.js 20 或更高版本。"
  read -r "?按回车键退出…"
  exit 1
fi

if [ ! -x "./node_modules/.bin/next" ]; then
  echo "首次运行需要安装依赖，请在此目录执行 pnpm install。"
  read -r "?按回车键退出…"
  exit 1
fi

if /usr/bin/curl -fsS "http://127.0.0.1:3000" >/dev/null 2>&1; then
  open "http://127.0.0.1:3000"
  exit 0
fi

if [ ! -f "./.next/BUILD_ID" ]; then
  echo "正在准备秋招时间表，首次启动可能需要一两分钟…"
  ./node_modules/.bin/next build
fi

(sleep 2; open "http://127.0.0.1:3000") &
exec ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3000
