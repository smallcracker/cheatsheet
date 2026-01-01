如何开始调试
插入代码：
import pdb; pdb.set_trace()
或者：
breakpoint()
breakpoint() 启动默认调试器pdb不需要import pdb 
如不想修改代码 可修改运行指令：
python -m pdb script.py
lineno是什么
lineno（行号）指源代码文件中的行号（从 1 开始） 
在命令中使用时 它指定文件中的特定行：
b 10：在当前文件的第 10 行设置断点 
until 15：执行到当前函数的第 15 行 
执行控制
s(tep)：执行当前行 进入被调用函数 
n(ext)：执行到当前函数的下一行 不进入函数内部 
c(ont(inue))：继续运行直到断点 
r(eturn)：执行到当前函数返回 
unt(il) [lineno]：执行到指定行号或当前行之后 
until [lineno]：命令执行到指定的行号
指的是当前函数中的行号 而不是整个文件的行号 
如果不指定 lineno 它执行到当前行之后的下一行 如有循环 就会先完成循环 然后运行到循环结束的下一行 
run [args] / restart [args]：保留断点重启程序
重启时不会重新编译、加载模块 不会检测代码变更 
断点管理
b(reak) [([filename:]lineno | function) [, condition]]：设置断点 支持条件 
无参数：列出所有当前断点的详细信息 
b myfile.py:20：myfile.py 的第 20 行设置断点 
b mymod.utils.add：mymod/utils.py 的 add 函数入口设置断点 
b 10 x > 5：在第 10 行设置断点 当 x > 5 时触发 
b add x == 10：在 add 函数入口设置断点 当 x == 10 时触发 
b myfile.py:10 x > 5：在 myfile.py 第 10 行设置条件断点（x > 5） 
tbreak [([filename:]lineno | function) [, condition]]：临时断点，命中一次后删除 
cl(ear) [filename:lineno | bpnumber ...]：清除断点 
无参数：清除调试会话中设置的所有断点 不会修改或删除源代码中的 breakpoint() 调用 
disable bpnumber ...：禁用断点（保留但不触发） 
enable bpnumber ...：启用断点 
ignore bpnumber [count]：设置断点忽略次数 
condition bpnumber [condition]：为断点添加/删除条件 
检查和显示
w(here) [count]：显示堆栈（箭头>表示当前帧） 
u(p) [count]：在堆栈中上移动帧 
d(own) [count]：在堆栈中下移动帧
l(ist) [first[, last]]：列出源码（当前行周围 11 行 默认延续上次） 
ll | longlist：列出当前函数全部源码 
a(rgs)：显示当前函数参数 
p expression：打印表达式值 
pp expression：美观打印表达式 
whatis expression：显示表达式类型 
显示表达式的类型（type） 帮助快速了解变量或对象的类别 
whatis x：如果 x 是整数 输出如 <class 'int'> 
whatis [1, 2, 3]：输出 <class 'list'> 
whatis lambda x: x**2：输出 <class 'function'> 
之后使用source expression：显示表达式的源代码 
尝试获取表达式的源代码并显示（主要用于函数、方法或类） 如果无法获取源代码（如内置函数） 会报错 
可快速检查对象性质 
display [expression]：每次停止时显示表达式（变化时提示） 
undisplay [expression]：停止显示表达式 
retval：显示当前函数最后返回值 
常用用法：
 > r  # 执行到函数结束
 > retval  # 显示返回值 例如：42
如果你当前还在函数内部（例如通过 s 或 n 停在某行） 函数还没执行完 return 返回值还没有被计算和存储 因此 retval 会显示错误（如 "No return value to display"） 因为返回值不存在 
其他功能
! statement：执行任意 Python 语句 
h(elp) [command]：显示帮助（help pdb 显示完整文档） 
q(uit)：退出调试器（程序中止） 
注意事项
PDB 支持 Tab 补全 快捷变量 .pdbrc 文件配置别名 
p $__name__ 检查当前模块
p $__file__ 检查当前文件位置
p $__doc__ 查看函数文档
p $__frame.f_locals 查看局部变量
p $__frame.f_globals 查看全局变量 
p $__frame.f_lineno 输出当前行号 
p $__exception__ 查看异常
p $__traceback__ 查看堆栈
