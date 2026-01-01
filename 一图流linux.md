以下是图片中Linux命令速查表的内容提取：


### **1. File Commands**
#### `ls [options] file` - 列出目录内容
- `-a`: 显示隐藏文件（含.和..）
- `-A`: 显示隐藏文件（不含.和..）
- `-h`: 以人类可读格式显示文件大小
- `-i`: 显示inode信息
- `-l`: 长格式输出
- `-m`: 以逗号分隔输出
- `-n`: 显示uid和gid而非用户名
- `-S`: 按文件大小排序
- `-t`: 按修改时间排序


#### `tree [options] dir` - 以树形结构显示目录
- `-d`: 仅显示目录
- `-f`: 显示完整路径
- `-I pattern`: 排除匹配pattern的文件
- `-P pattern`: 仅显示匹配pattern的文件
- `-h`: 以人类可读格式显示文件大小
- `-C`: 彩色输出
- `-L max`: 限制最大目录深度


#### `cp [options] source dest` - 复制文件或目录
- `-b`: 覆盖前备份
- `-r`: 递归复制（目录）
- `-l`: 创建硬链接而非复制
- `-s`: 创建软链接
- `-u`: 仅复制比目标新的文件
- `-i`: 覆盖前交互确认


#### `mv [options] source dest` - 移动或重命名文件
- `-b`: 覆盖前备份
- `-f`: 强制覆盖
- `-u`: 仅移动比目标新的文件
- `-i`: 覆盖前交互确认


#### `ln [options] file link` - 创建链接
- `-s`: 创建软链接（默认硬链接）
- `-f`: 覆盖已存在的链接
- `-b`: 覆盖前备份


#### `rm [options] file` - 删除文件或目录
- `-f`: 强制删除
- `-i`: 交互确认
- `-r`: 递归删除（目录）
- `-rf`: 强制递归删除（如`rm -rf /`危险）


#### `chmod [options] mode files` - 修改文件权限
- `-R`: 递归修改
- `-X`: 仅给目录添加执行权限
- **符号模式格式**：`u/g/o/a [+-=] [rwx]`
  - `u`: user(所有者) | `g`: group(组) | `o`: other(其他) | `a`: all(所有)
  - `+`: 添加权限 | `-`: 移除权限 | `=`: 设置权限（覆盖）
  - `r`: read(读=4) | `w`: write(写=2) | `x`: execute(执行=1)
- **数字模式格式**：三位数字（所有者-组-其他），每位是r+w+x之和
  - `7=rwx` | `6=rw-` | `5=r-x` | `4=r--` | `0=---`
- **用法案例**：
  - `chmod +x script.sh` - 添加执行权限
  - `chmod 755 file` - rwxr-xr-x（所有者全权限，组和其他读执行）
  - `chmod 644 file` - rw-r--r--（所有者读写，组和其他只读）
  - `chmod u+rw,go-rwx file` - 仅所有者读写
  - `chmod -R 755 dir/` - 递归修改目录权限
  - `chmod a+r file` - 所有用户可读
  - `chmod o-w file` - 移除其他用户写权限


#### `find path [options] [tests] [actions]` - 查找文件
- `path`: 搜索路径
- `--mindepth N`: 最小搜索深度
- `--maxdepth N`: 最大搜索深度
- `-name "xyz*"`: 匹配文件名（如`xyz*`）
- `-iname "xyz*"`: 文件名匹配（忽略大小写）
- `-type f/d`: 仅搜索文件/目录
- `-mtime -x`: 最近x天内修改
- `-mtime +x`: 超过x天未修改
- `-size +100M`: 大于100M（k/K、G/G）
- `-perm 000`: 无权限
- `-exec cmd {} \;`: 对匹配文件执行cmd
- `-delete`: 删除匹配文件


#### `cat [options] files` - 显示文件内容
- `-v`: 显示非ASCII字符（除tab和换行）
- `-T`: 显示tab为^I
- `-E`: 显示换行符为$
- `-n`: 显示行号
- `-s`: 压缩连续空行


#### `tail [options] file` - 显示文件末尾
- `-f`: 实时跟踪文件末尾
- `-35`: 显示最后35行
- `-q`: 静默模式


#### `head [options] file` - 显示文件开头
- `-35`: 显示前35行
- `-q`: 静默模式


#### `tac files` - 反向显示文件内容
- 反向输出文件（从最后一行开始）


#### `cut [options] file` - 按列提取文本
- `-d char`: 自定义分隔符
- `-f 1,3,5`: 提取第1、3、5列


#### `uniq [options] input output` - 去除重复行
- `-c`: 显示重复行次数
- `-d`: 仅显示重复行
- `-u`: 仅显示唯一行


#### `sort [options] file` - 排序文本
- `-f`: 忽略大小写
- `-n`: 按数字排序
- `-r`: 反向排序


#### `tar [options] file` - 归档和压缩
- `-f`: 指定归档文件
- `-c`: 创建归档
- `-x`: 提取文件
- `-v`: 显示过程
- `-z`: 用gzip压缩
- `-j`: 用bzip2压缩


#### `du [options] file` - 显示磁盘使用量
- `-c`: 显示总计
- `-h`: 人类可读格式
- `-L`: 跟随软链接
- `-P`: 不跟随软链接
- `--maxdepth N`: 最大深度


#### `diff [options] files` - 比较文件差异
- `-r`: 递归比较
- `-w`: 忽略空格
- `-B`: 忽略空行


#### `grep [options] pattern files` - 搜索文本
- `-i`: 忽略大小写
- `-P`: 使用Perl正则
- `-m N`: 匹配N次后停止
- `-n`: 显示行号
- `-c`: 显示匹配行数
- `-v`: 反向匹配
- `-R`: 递归搜索
- `--include=glob`: 仅匹配指定文件


### **2. Process Commands**
#### `ps [options]` - 显示进程
- `-e`: 显示所有进程
- `-f`: 显示完整信息
- `-H`: 显示进程树
- `-p pid`: 显示指定pid的进程
- `-u user`: 显示用户的进程
- `-x`: 显示无终端的进程


#### `top [options]` - 实时显示进程
- `-x`: 高亮排序列
- `-d N`: 每N秒刷新
- `-p pid`: 仅显示指定pid
- `-i`: 隐藏闲置进程
- `-c`: 显示完整命令行
- `-k`: 终止进程
- `-u`: 显示指定用户的进程


#### `pgrep [options] pattern` - 查找进程
- `-l`: 显示pid和进程名
- `-o`: 显示最旧的进程
- `-n`: 显示最新的进程
- `-u uid`: 显示指定uid的进程
- `-c`: 统计匹配数


#### `df [options] file` - 显示磁盘空间
- `-h`: 人类可读格式
- `-i`: 显示inode信息
- `-l`: 仅显示本地文件系统


### **3. Network & Remote**
#### `ssh [options] user@host ["cmd1;cmd2"]` - 远程登录
- `-2`: 强制Protocol 2
- `-o StrictHostKeyChecking=no`: 忽略主机密钥警告
- `-X`: 转发X11


#### `scp [options] source dest` - 安全复制文件
- `-r`: 递归复制目录
- `-P port`: 指定端口号
- `-p`: 保留文件属性（时间戳、权限等）
- `-C`: 启用压缩传输
- `-v`: 显示详细过程
- `-q`: 静默模式
- `-l limit`: 限制带宽（Kbit/s）


#### `wget [options] url` - 下载文件
- `-b`: 后台下载
- `-O file`: 保存到指定文件
- `-q`: 静默模式
- `-P dir`: 保存到指定目录
- `-T N`: 超时N秒
- `--user=xxx`: HTTP认证用户名


#### `curl [options] url` - 传输数据
- `-u user:pass`: HTTP基础认证
- `-H "Header: val"`: 自定义请求头
- `-L`: 跟随重定向
- `-d "key=val"`: 发送表单数据
- `-X METHOD`: 指定请求方法（GET/POST等）


### **4. Terminal**
- `Ctrl+C`: 终止当前命令
- `Ctrl+Z`: 暂停当前命令（后台）
- `bg`: 后台运行暂停的命令
- `fg`: 前台恢复暂停的命令
- `Ctrl+W`: 删除当前单词
- `Ctrl+U`: 删除当前行
- `Ctrl+A`: 移到行首
- `Ctrl+E`: 移到行尾