# Git 命令速查表

> ⚠️ **开始工作前，请务必先建分支！**
> `$ git switch -c <新分支名>`

## 设置
设置将附加到你的提交和标签的姓名和邮箱

```bash
$ git config --global user.name "你的姓名"
$ git config --global user.email "你的邮箱@gmail.com"
```

## 开始项目
创建本地仓库（省略 `<目录>` 会将当前目录初始化为 git 仓库）

```bash
$ git init <目录>
```

下载远程仓库

```bash
$ git clone <仓库地址>
```

## 忽略文件
创建一个名为 `.gitignore` 的文件，列出要忽略的文件或目录模式（如 `*.log`, `node_modules/`）

```gitignore
*.log        # 忽略所有 .log 结尾的文件
node_modules/ # 忽略 node_modules 目录
.env         # 忽略环境配置文件
!main.log    # 例外：即使忽略了 *.log，也追踪 main.log
```

## 进行修改
添加文件到暂存区

```bash
$ git add <文件>
```

暂存所有文件

```bash
$ git add .
```

提交所有暂存的文件到 git

```bash
$ git commit -m "提交信息"
```

修改最后一次提交（例如修正提交信息或添加漏掉的暂存文件）

```bash
$ git commit --amend -m "新的提交信息"
```

## 基本概念

- **main**: 默认开发分支（现代仓库多为 main，旧仓库可能是 master）
- **origin**: 默认远程仓库名称/别名（通常在 clone 时自动创建）
- **HEAD**: 指向当前分支引用的指针（detached HEAD 时会直接指向某个提交）
- **HEAD^**: HEAD 的直接父提交
- **HEAD~4**: HEAD 的上第 4 代祖先提交

### 什么是 commit-ish

`commit-ish` 指“任何能被 Git 解析为某个提交（commit）的引用”。很多命令的参数写 `commit-ish`，表示你既可以传提交哈希，也可以传分支名/标签/HEAD 等引用。

常见的 commit-ish 形式：

- 提交哈希（完整或前缀）：`a1b2c3d`、`a1b2c3`
- 分支/标签：`main`、`feature/login`、`v1.2.0`
- 特殊引用与祖先语法：`HEAD`、`HEAD^`、`HEAD~3`
- 显式引用名：`refs/heads/main`、`refs/tags/v1.2.0`

后续命令中，凡是参数标成 `<commit-ish>`，都表示这里可以填上述任意一种。

## 分支
列出所有本地分支。添加 `-r` 标志显示所有远程分支。`-a` 标志显示所有分支。

```bash
$ git branch
```

查看本地分支及其跟踪的远程分支（upstream）

```bash
$ git branch -vv
```

创建新分支

```bash
$ git branch <新分支名>
```

切换到分支并更新工作目录

```bash
$ git checkout <分支名>
$ git switch <分支名>      # (Git 2.23+)
```

创建新分支并切换到该分支

```bash
$ git checkout -b <新分支名>
$ git switch -c <新分支名> # (Git 2.23+)
```

删除已合并的分支

```bash
$ git branch -d <分支名>
```

删除分支（无论是否已合并）

```bash
$ git branch -D <分支名>
```

为当前提交添加标签（常用于新版本发布）

```bash
$ git tag <标签名>                       # 轻量标签
$ git tag -a <标签名> -m "版本说明"      # 附注标签（推荐）
```

列出标签 / 查看标签指向的提交

```bash
$ git tag
$ git show <标签名>
```

## 合并
将分支 a 合并到分支 b。添加 `--no-ff` 选项进行非快进合并

```bash
$ git checkout b
$ git merge a
```

合并冲突后放弃本次合并（回到合并前状态）

```bash
$ git merge --abort
```

合并并将所有提交压缩为一个新提交：把分支/提交 a 相对当前分支引入的所有改动合并成一份改动应用到你当前分支的暂存区，但不创建 merge commit、也不保留 a 的提交历史。等待自己 git commit 生成一个普通提交。

```bash
$ git merge --squash a
```

将特定提交应用到当前分支（摘樱桃）

```bash
$ git cherry-pick <commit-ish>
```

摘樱桃冲突后继续/放弃

```bash
$ git cherry-pick --continue
$ git cherry-pick --abort
```

## 变基

rebase 这条命令的核心语义其实只有一个：“把一串提交（commits）从原来的基点上‘搬运’到另一个地方，并在搬运过程中可以改写这些提交”。

主要用于将特性分支变基到主分支（以包含主分支的新更改），同时防止不必要的合并提交进入特性分支，保持历史记录整洁。

```bash
$ git checkout feature
$ git rebase main
```

变基冲突后继续/放弃

```bash
$ git rebase --continue
$ git rebase --abort
```

在变基到主分支之前交互式清理分支的提交

```bash
$ git rebase -i main
```

交互式变基会打开一个“todo 列表”（从上到下依次执行）。你可以：调整提交顺序、合并提交、改提交信息、删除提交等。交互式 rebase 做的仍然是同一件事：把一串提交拿出来，然后按照“脚本”去重放。

todo 列表常用操作（把每行开头的 `pick` 改成下面这些）：

- `pick`：保留该提交
- `reword`：保留该提交，但在执行时会让你修改提交信息
- `edit`：暂停在该提交，允许你修改内容（例如补文件、拆分提交等）
- `squash`：把该提交合并进上一条提交，并让你编辑合并后的提交信息
- `fixup`：把该提交合并进上一条提交，但丢弃该提交自己的提交信息
- `drop`：丢弃该提交
- `exec <cmd>`：在该步骤执行一条命令（例如跑测试）


如果中途想再编辑 todo 列表：

```bash
$ git rebase --edit-todo
```

提示：`rebase -i` 会改写历史。不要在已经推送并被他人基于其开发的公共分支上随意使用。确实需要推送改写后的历史时，优先用：

```bash
$ git push --force-with-lease
```

交互式变基当前分支的最后 3 个提交

```bash
$ git rebase -i HEAD~3
```

## 撤销操作
移动（和/或重命名）文件并暂存移动操作

```bash
$ git mv <原路径> <新路径>
```

从工作目录和暂存区删除文件，然后暂存删除操作

```bash
$ git rm <文件>
```

仅从暂存区删除

```bash
$ git rm --cached <文件>
```

查看/临时检出某次提交
若 `<commit-ish>` 为提交哈希或标签（而非分支名），会进入 detached HEAD 状态（此时 HEAD 直接指向提交，不属于任何分支）。

```bash
$ git checkout <commit-ish>
```

更推荐的写法（Git 2.23+）

```bash
$ git switch --detach <commit-ish>
```

创建新提交，撤销指定提交的更改

```bash
$ git revert <commit-ish>
```

丢弃工作区中指定文件的未提交修改（会被索引/HEAD 覆盖，谨慎）

```bash
$ git checkout -- <文件>
```

更推荐的写法（Git 2.23+）：恢复工作区/暂存区

```bash
$ git restore <文件>              # 丢弃工作区改动
$ git restore --staged <文件>     # 取消暂存（保留工作区改动）
```

重置分支指针到指定提交（`reset` 会移动当前分支指向的提交）。不同模式对“暂存区/工作区”的影响不同，使用前务必确认

```bash
$ git reset --soft <commit-ish>  # 移动 HEAD；保留暂存区与工作区（变更保留在暂存区）
$ git reset <commit-ish>         # 默认 mixed：重置暂存区；保留工作区
$ git reset --hard <commit-ish>  # 警告：重置暂存区与工作区（丢弃未提交更改）
```

删除未跟踪文件/目录（危险操作，先用 `-n` 预览）

```bash
$ git clean -nfd
$ git clean -fd
```

## 查看仓库
列出尚未提交的新文件或修改过的文件

```bash
$ git status
```

更紧凑的状态输出

```bash
$ git status -sb
```

列出提交历史记录及相应的 ID

```bash
$ git log --oneline
```

查看包含分支拓扑的历史（常用）

```bash
$ git log --graph --oneline --decorate --all
```

查看某次提交/某个对象的详细内容

```bash
$ git show <commit-ish>
```

显示工作区与暂存区的差异（还有什么改动没提交）。要查看暂存文件的更改，添加 `--cached` 选项

```bash
$ git diff
```

查看暂存区与 HEAD 的差异

```bash
$ git diff --cached
```

显示两个提交之间的更改

```bash
$ git diff <commit-ish1> <commit-ish2>
```

显示引用日志（查看分支顶端的所有变更历史，用于找回丢失的提交）

```bash
$ git reflog
```

定位是谁/何时修改了某行（排查回归常用）

```bash
$ git blame <文件>
```

## 储藏
存储已修改和暂存的更改。要包含未跟踪的文件，添加 `-u` 标志。要包含未跟踪和忽略的文件，添加 `-a` 标志。

```bash
$ git stash
```

同上，但添加注释（较新的写法是 `push -m`；旧写法 `save` 仍可用但不推荐）。

```bash
$ git stash push -m "注释"
$ git stash save "注释"   # 旧写法
```

部分储藏。仅储藏单个文件、文件集合或文件内的个别更改

```bash
$ git stash -p
```

列出所有储藏

```bash
$ git stash list
```

重新应用储藏而不删除它

```bash
$ git stash apply
```

重新应用索引为 2 的储藏，然后从储藏列表中删除它。省略 stash@{n} 以弹出最近的储藏。

```bash
$ git stash pop stash@{2}
```

重新应用并尝试恢复暂存区状态

```bash
$ git stash pop --index
```

显示储藏 1 的差异摘要。传递 `-p` 标志以查看完整差异。

```bash
$ git stash show stash@{1}
```

删除索引为 1 的储藏。省略 stash@{n} 以删除最近创建的储藏

```bash
$ git stash drop stash@{1}
```

删除所有储藏

```bash
$ git stash clear
```

## 同步
添加远程仓库

```bash
$ git remote add <别名> <仓库地址>
```

修改远程仓库地址（例如更换 URL）

```bash
$ git remote set-url <别名> <新URL>
```


查看所有远程连接。添加 `-v` 标志查看地址。

```bash
$ git remote
$ git remote -v
```

删除连接

```bash
$ git remote remove <别名>
```

重命名连接

```bash
$ git remote rename <旧名> <新名>
```

从远程仓库获取所有分支（不合并）

```bash
$ git fetch <别名>
```

清理已被远端删除的远程跟踪分支（常用）

```bash
$ git fetch --prune <别名>
```

获取特定分支

```bash
$ git fetch <别名> <分支>
```

获取远程仓库当前分支的副本，然后合并

```bash
$ git pull
```

将本地更改移动（变基）到远程仓库新更改的顶部（用于整洁的线性历史记录）

```bash
$ git pull --re <分支>base <别名>
```

上传本地内容到远程仓库

```bash
$ git push <别名>
```

上传到分支（然后可以创建拉取请求）

```bash
$ git push <别名> <分支>
```

将本地分支推送到远程不同名的分支

```bash
$ git push <别名> <本地分支名>:<远程分支名>
```

首次推送并设置 upstream（若远程不存在该分支会自动创建，之后可直接 `git push`/`git pull`）

```bash
$ git push -u <别名> <分支>
```

推送标签

```bash
$ git push <别名> <标签名>
$ git push <别名> --tags
```