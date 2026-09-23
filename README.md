# subconverter-cf

通过 Cloudflare Worker 调用 Cloudflare Container 中的 [subconverter](https://github.com/tindy2013/subconverter) 官方 Docker 镜像。容器运行原项目，Worker 负责入口鉴权和转发；这不是把 C++ 程序编译成普通 Worker。

> **需要 Cloudflare Workers Paid 计划。** 普通免费 Worker 不能运行这个 Docker 镜像。Cloudflare Containers 的实例用量会产生费用。

## 从 GitHub 部署

1. 在 Cloudflare 控制台打开 **Workers & Pages → Create application → Import a repository**，连接本仓库。
2. 选择生产分支 `main`，Worker 名称设为 `subconverter-cf`（须与 `wrangler.jsonc` 一致）。项目根目录使用仓库根目录。
3. 部署命令设为 `pnpm run deploy`；依赖安装使用 `pnpm install --frozen-lockfile`。保存并部署。首次容器配置可能要等待几分钟。
4. 打开这个 Worker 的 **Settings → Variables and Secrets**，新增 Secret `ACCESS_KEY`，值使用足够长的随机字符串；保存后重新部署，使 Secret 生效。设置好之前 `/sub` 会返回 403。
5. 访问 `https://你的Worker地址/version`，确认返回 subconverter 的版本文字。

Cloudflare Workers Builds 的生产分支需要执行完整的 `wrangler deploy`，才能部署 Worker 并更新 Container。此项目直接使用公开 Docker Hub 镜像，不需要在构建环境中安装 Docker。

## 转换订阅

```text
https://你的Worker地址/sub?target=clash&url=经过URL编码的原订阅链接&key=你的ACCESS_KEY
```

例如，原链接是 `https://source.example/sub`，请求地址里的 `url` 参数应写成 `https%3A%2F%2Fsource.example%2Fsub`。多个订阅的合并和其他参数参见 [subconverter 原项目说明](https://github.com/tindy2013/subconverter#quick-usage)。Worker 会验证并移除 `key` 参数，再转发给容器。

`ACCESS_KEY` 会出现在你交给客户端的订阅 URL 中，请把这个 URL 当作密码保管。Worker 只开放 GET `/sub` 与 GET `/version`，不对外暴露原项目的配置更新等接口。

## 本地开发

```bash
pnpm install
pnpm test
pnpm dev
```

本地运行容器需要 Docker。`ACCESS_KEY` 可写进本地 `.dev.vars` 文件（已被 Git 忽略）：

```text
ACCESS_KEY=你的随机密钥
```

## 来源与配置

- 后端镜像：`docker.io/tindy2013/subconverter:latest`
- 容器端口：`25500`
- 同时运行实例上限：`1`
- 空闲十分钟后休眠；下一次请求可能需要等待容器启动

要固定后端版本，可把 `wrangler.jsonc` 中的 `latest` 换成镜像的确定版本或 digest。若要修改 `pref.ini`、规则等文件，需要改为基于官方镜像构建自己的 Dockerfile，而不是在运行中的容器内手动修改；容器文件系统不适合作为持久配置存储。
