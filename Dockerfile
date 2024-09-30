# ベースイメージを指定
FROM node:20-alpine

# アプリケーションディレクトリを作成
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

RUN npx prisma generate

# TypeScriptをコンパイル
RUN npm run build

# コンテナが起動する際に実行するコマンドを指定
CMD ["node", "dist/server.js"]