# 🐳 Docker 速查表

---

## 运行新容器
> **通用格式**：`docker run [OPTIONS] IMAGE [COMMAND] [ARG...]`

| 功能描述                                                          | 命令参数 / 示例             |
| ----------------------------------------------------------------- | --------------------------- |
| 从镜像启动一个新容器                                              | `docker run nginx`          |
| ...并为其指定名称                                                 | `--name web`                |
| ...并映射端口                                                     | `-p 8080:80`                |
| ...并映射所有端口                                                 | `-P`                        |
| ...并为其指定主机名                                               | `--hostname svr`            |
| ...并添加 DNS 记录                                                | `--add-host HOSTNAME:IP`    |
| ...并将本地目录映射到容器内                                       | `-v /HOSTDIR:/CONTAINERDIR` |
| ...以后台模式启动容器，并且进入交互模式，方便后续随时进入容器操作 | `-itd`                      |
| ...但更改入口点 (即默认执行程序)                                  | `--entrypoint bash`         |

---

## 管理容器
| 功能描述                                                           | 命令示例                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 显示正在运行的容器列表                                             | `docker ps`                                                                   |
| 显示所有容器列表                                                   | `docker ps -a`                                                                |
| 删除一个容器                                                       | `docker rm CONTAINER`<br>`docker rm web`                                      |
| 强制删除一个运行中的容器                                           | `docker rm -f CONTAINER`<br>`docker rm -f web`                                |
| 删除所有已停止的容器                                               | `docker container prune`                                                      |
| 停止一个运行中的容器                                               | `docker stop CONTAINER`<br>`docker stop web`                                  |
| 启动一个已停止的容器                                               | `docker start CONTAINER`<br>`docker start web`                                |
| 将文件从容器复制到宿主机                                           | `docker cp CONTAINER:SOURCE TARGET`<br>`docker cp web:/index.html index.html` |
| 将文件从宿主机复制到容器                                           | `docker cp TARGET CONTAINER:SOURCE`<br>`docker cp index.html web:/index.html` |
| 在运行中的容器内启动一个 shell（也就是连接到一个正在运行的容器中） | `docker exec -it CONTAINER EXECUTABLE`<br>`docker exec -it web bash`          |
| 重命名容器                                                         | `docker rename OLD_NAME NEW_NAME`<br>`docker rename 096 web`                  |
| 从容器创建一个镜像                                                 | `docker commit CONTAINER`<br>`docker commit web`                              |

---

## 管理镜像
| 功能描述                       | 命令示例                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| 下载镜像                       | `docker pull IMAGE[:TAG]`<br>`docker pull nginx`                 |
| 向仓库上传镜像                 | `docker push IMAGE`<br>`docker push myimage:1.0`                 |
| 删除镜像                       | `docker rmi IMAGE`                                               |
| 显示所有镜像列表               | `docker images`                                                  |
| 删除虚悬 (dangling) 镜像       | `docker image prune`                                             |
| 删除所有未使用的镜像           | `docker image prune -a`                                          |
| 从 Dockerfile 构建镜像         | `docker build DIRECTORY`                                         |
| 给镜像打标签                   | `docker tag IMAGE NEWIMAGE`<br>`docker tag ubuntu ubuntu:18.04`  |
| 从 Dockerfile 构建镜像并打标签 | `docker build -t IMAGE DIRECTORY`<br>`docker build -t myimage .` |
| 将镜像保存为 .tar 文件         | `docker save IMAGE > FILE`<br>`docker save nginx > nginx.tar`    |
| 从 .tar 文件加载镜像           | `docker load -i TARFILE`<br>`docker load -i nginx.tar`           |

---

## 信息与统计
| 功能描述                     | 命令示例                                        |
| ---------------------------- | ----------------------------------------------- |
| 查看容器日志                 | `docker logs CONTAINER`<br>`docker logs web`    |
| 查看运行中容器的统计信息     | `docker stats`                                  |
| 查看容器内的进程             | `docker top CONTAINER`<br>`docker top web`      |
| 查看已安装的 Docker 版本     | `docker version`                                |
| 获取对象的详细信息           | `docker inspect NAME`<br>`docker inspect nginx` |
| 查看容器内所有被修改过的文件 | `docker diff CONTAINER`<br>`docker diff web`    |
| 查看容器的端口映射           | `docker port CONTAINER`<br>`docker port web`    |

---