# Python 数据结构面试 Cheat Sheet — List / Dict / Tuple / NumPy

> 💡 **目标读者** — 准备 Python 技术面试的候选人。涵盖从基础操作到 CPython 内部机制的完整知识链。

## §0 TL;DR Cheat Sheet

1. **List** — 动态数组，$O(1)$ 随机访问，$O(1)$ amortized 尾部追加，切片返回浅拷贝
2. **Dict** — 开放寻址哈希表，CPython 3.6 compact dict 实现细节保留插入序（Python 3.7+ 正式语言保证），$O(1)$ 平均查找/插入
3. **Tuple** — 不可变序列，hashable 可用作 dict key，struct sequence 无 over-allocation
4. **NumPy** — 同构 dtype + strided memory，向量化操作比纯 Python 快 10-200x，核心是 broadcasting + stride
5. **选择直觉** — 有序用 list/tuple，映射用 dict，数值计算用 NumPy，不可变且需哈希用 tuple
6. **关键陷阱** — list 乘法共享引用、dict key 必须 hashable、tuple 单元素逗号、NumPy view vs copy

## §1 直觉 — 数据结构选择的思维模型

### 1.1 核心类比

```
List   = 一排带编号的储物柜（顺序，可变，可重复）
Tuple  = 一份签好字的合同（顺序，不可变，可哈希）
Dict   = 一本电话簿（键-值映射，O(1) 查找）
NumPy  = 一套实验室批量处理器（同构数据，向量化操作）
```

### 1.2 何时选什么——一句话直觉

> 💡 **数据结构选择口诀** — "有序可变选 List，不可变哈希用 Tuple；键值查找靠 Dict，数值矩阵上 NumPy"

- 你需要维护一个 **有序、可变** 的序列 → `list`
- 你需要一个 **不可变、可哈希** 的序列（用作 dict key、集合元素）→ `tuple`
- 你需要 **键→值** 映射，快速查找 → `dict`
- 你需要对 **同构数值** 做批量数学运算 → `numpy.ndarray`
- 你既要 **命名字段** 又想要 **不可变性** → `collections.namedtuple` / `dataclass`

## §2 List 核心概念与操作

### 2.1 内部实现——动态数组

Python list 的底层是 **over-allocated dynamic array**（CPython 源码：`Objects/listobject.c`）。它维护一个 C 指针数组 `ob_item`，指向实际的 PyObject。关键参数：

- `ob_size`：当前元素个数
- `allocated`：已分配的总容量

扩容策略（CPython 经典实现，3.11+ 版本中阈值有调整，完整代码见 `Objects/listobject.c`）：

$$\boxed{\text{new\_allocated} \approx \text{new\_size} + (\text{new\_size} \gg 3) + 6}$$

这保证了 **amortized $O(1)$** 的尾部追加。

### 2.2 核心操作速查

```python
# ---- 创建 ----
a = [1, 2, 3]                    # 直接构造
b = [0] * 10                     # 重复（⚠️ 对象共享引用，见 §7）
c = [x ** 2 for x in range(10)]  # 列表推导式

# ---- 索引与切片（O(1)） ----
a[0]        # 1
a[-1]       # 3
a[1:3]      # [2, 3] — 浅拷贝
a[::-1]     # [3, 2, 1] — 反转

# ---- 追加与扩展 ----
a.append(4)       # O(1) amortized，尾部添加单个元素
a.extend([5, 6])  # O(k)，批量追加迭代器中的所有元素
a.insert(0, 0)    # O(n)，在位置 0 插入，所有后续元素后移
a.pop()           # O(1)，删除并返回尾部元素；a.pop(0) 是 O(n)

# ---- 排序 ----
a.sort()                     # 原地排序，O(n log n)，返回 None
b = sorted(a, reverse=True)  # 返回新列表，原列表不变
a.sort(key=lambda x: -x)     # 自定义排序键

# ---- 查找 ----
3 in a      # O(n)
a.index(3)  # O(n)，返回首次出现的索引
a.count(3)  # O(n)
```

### 2.3 列表推导式与生成器表达式

```python
# 列表推导式 — 立即构建整个列表
squares = [x ** 2 for x in range(1000)]  # 内存中持有 1000 个 int

# 生成器表达式 — 惰性求值，节省内存
squares_gen = (x ** 2 for x in range(1000))  # 不占用额外内存
next(squares_gen)  # 0 (按需计算)

# 带过滤条件的推导式
evens = [x for x in range(100) if x % 2 == 0]  # 筛选偶数

# 嵌套推导式 — 展平二维列表
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [x for row in matrix for x in row]  # [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### 2.4 解包与切片赋值

```python
# 解包（unpacking）
first, *middle, last = [1, 2, 3, 4, 5]
# first=1, middle=[2,3,4], last=5

# 切片赋值
a = [0, 1, 2, 3, 4]
a[1:3] = [9, 9, 9]  # a = [0, 9, 9, 9, 3, 4] — 替换切片
a[::2] = [0, 0, 0]  # 步长切片赋值，左右长度必须相等
```

## §3 Dict 核心概念与操作

### 3.1 内部实现——哈希表

CPython 3.6+ 使用 **compact dict**（设计理念受 PyPy 实现启发，由 Raymond Hettinger 主导设计，INADA Naoki 贡献 CPython 代码实现；Python 3.7 起正式纳入语言规范），采用开放寻址（open addressing）。核心结构：

- `dk_indices`：哈希索引表（存储 `dk_entries` 的索引）
- `dk_entries`：密集存储的键值对数组（插入顺序即遍历顺序）

$$\text{index} = \text{hash(key)} \mathbin{\&} (\text{size} - 1)$$

> ⚠️ **加载因子与扩容** — dict 的加载因子约为 2/3。当 `used / size > 2/3` 时触发 rehash。扩容后大小翻倍并重新哈希所有 key，成本 $O(n)$。

### 3.2 核心操作速查

```python
# ---- 创建 ----
d = {"a": 1, "b": 2}
d = dict(a=1, b=2)
d = dict([("a", 1), ("b", 2)])
# 字典推导式
squares = {x: x ** 2 for x in range(10)}  # {0: 0, 1: 1, ..., 9: 81}

# ---- 访问 (基于 d = {"a": 1, "b": 2}) ----
d["a"]           # 1（key 不存在时抛出 KeyError）
d.get("z", 0)    # 安全访问，返回默认值 0
d.setdefault("z", 0)  # 如果 key 不存在则设置并返回值

# ---- 修改 ----
d["c"] = 3                  # 插入/更新
d.update({"c": 3, "d": 4})  # 批量更新
del d["a"]                  # 删除
val = d.pop("a", None)      # 安全删除（key 不存在时返回 None）

# ---- 视图与遍历 ----
d.keys()     # dict_keys 视图（动态反映 dict 变化）
d.values()   # dict_values 视图
d.items()    # dict_items 视图
for k, v in d.items(): ...  # 遍历键值对（推荐）

# ---- 合并 (Python 3.9+) ----
d1 = {"a": 1, "b": 2}
d2 = {"b": 3, "c": 4}
d3 = d1 | d2   # {"a": 1, "b": 3, "c": 4} — 冲突时 d2 覆盖 d1
d1 |= d2       # d1 = {"a": 1, "b": 3, "c": 4} — 就地合并
```

### 3.3 dict 变体与适用场景

```python
from collections import defaultdict, OrderedDict, Counter, ChainMap

# defaultdict — 自动为缺失 key 提供默认值
dd = defaultdict(list)
dd["a"].append(1)  # 无需检查 dd["a"] 是否存在

# Counter — 计数专用
cnt = Counter("abracadabra")
# Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})
cnt.most_common(2)  # [('a', 5), ('b', 2)]

# OrderedDict — Python 3.7+ 普通 dict 已保证插入序
# 但 OrderedDict 额外支持：move_to_end(), reversed()
od = OrderedDict([("a", 1), ("b", 2)])
od.move_to_end("a")  # 将 "a" 移到最后

# ChainMap — 多层 dict 串联查找
defaults = {"color": "red", "size": "M"}
custom = {"color": "blue"}
cm = ChainMap(custom, defaults)
cm["color"]  # "blue" (先查 custom)
cm["size"]   # "M"    (再查 defaults)
```

## §4 Tuple 核心概念与操作

### 4.1 不可变性的真正含义

Tuple 的 **不可变** 指的是其 **结构** 不可变——即 `ob_item` 指针数组不能改变。但被指向的对象如果是可变的，其内部状态可以变化。

$$(\text{tuple 不可变}) \neq (\text{元素对象不可变})$$

```python
t = (1, [2, 3], "hello")
t[0] = 0       # ❌ TypeError: 'tuple' object does not support item assignment
t[1].append(4) # ✅ 合法！t = (1, [2, 3, 4], "hello")
```

### 4.2 核心操作

```python
# ---- 创建 ----
t = (1, 2, 3)
t = 1, 2, 3         # 括号可省略
t = (1,)            # ⚠️ 单元素 tuple 必须加逗号！(1) 是 int

# ---- 解包（核心用途） ----
a, b = (1, 2)           # 基本解包
a, b = b, a             # 利用 tuple 实现原地交换
x, y, *rest = (1, 2, 3, 4)  # rest = [3, 4]

# ---- namedtuple — 命名元组 ----
from collections import namedtuple
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
p.x, p.y  # 3, 4
p._asdict()  # {"x": 3, "y": 4} — 转换为 dict (Python < 3.8 返回 OrderedDict)
```

## §5 NumPy 数组核心操作

### 5.1 ndarray — 核心数据结构

NumPy 数组是 **同构类型**（homogeneous）、**可跨步访问**（strided memory view）的多维数组，默认行为 C-order 连续分配，但切片/转置可产生非连续 view。与 Python list 的关键区别：

| 特性 | Python list | NumPy ndarray |
|---|---|---|
| **元素类型** | 异构（可以混合） | 同构（所有元素同一 dtype） |
| **内存布局** | 指针数组 + 分散对象 | strided memory（默认 C-order，可为非连续 view） |
| **运算方式** | 解释器循环执行 | 编译级向量化（C/Fortran 底层） |
| **速度（逐元素求和）** | ~100ms / 1M 元素 | ~1ms / 1M 元素 |
| **广播** | ❌ 不支持 | ✅ 自动广播 |

### 5.2 创建与属性

```python
import numpy as np

# ---- 创建数组 ----
a = np.array([1, 2, 3])                    # 从 list 创建
b = np.zeros((3, 4))                       # 全零矩阵
c = np.ones((2, 3))                        # 全一矩阵
d = np.eye(3)                              # 3x3 单位矩阵
e = np.arange(0, 10, 0.5)                  # 等间距序列
f = np.linspace(0, 1, 100)                 # 等分 100 个点
g = np.random.randn(1000)                  # 标准正态分布
h = np.empty((100, 100))                   # 未初始化数组

# ---- 关键属性 ----
a.shape    # (3,) — 各维大小
a.dtype    # dtype('int64') — 元素类型
a.ndim     # 1 — 维度数
a.size     # 3 — 总元素数
a.strides  # (8,) — 每个维度的字节步长
a.itemsize # 8 — 单个元素字节数
a.nbytes   # 24 — 总字节数 (8*3)
```

### 5.3 索引、切片与高级索引

```python
import numpy as np

# 使用 np.array 直接创建，arr.base 为 None（无底层 base）
arr = np.array([[0, 1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10, 11],
                [12, 13, 14, 15, 16, 17],
                [18, 19, 20, 21, 22, 23]])

# ---- 基本切片（返回 view） ----
arr[0]       # 第 0 行
arr[:, 1]    # 第 1 列
arr[:2, 1:3] # 前 2 行 × 第 1-2 列

# ---- 花式索引（fancy indexing，返回 copy） ----
arr[[0, 2, 3]]           # 选择第 0, 2, 3 行
arr[[0, 2, 3], [1, 2, 3]]  # 选择 (0,1), (2,2), (3,3) 三个元素

# ---- 布尔索引 ----
mask = arr > 10
arr[mask]  # 扁平化返回所有满足条件的元素
arr[arr > 10] = 0  # 布尔赋值

# ---- view 还是 copy？ ----
v = arr[:2]     # view — 修改 v 会影响 arr
c = arr[[0, 1]] # copy — 修改 c 不影响 arr
v.base is arr   # True — 确认是 view（arr 无底层 base）
c.base is None  # True — 确认是 copy
```

### 5.4 Broadcasting 规则

Broadcasting 允许不同形状的数组进行算术运算，无需显式复制数据：

$$\boxed{\text{从最后一个维度向前比较，维度必须相等或其中之一为 1}}$$

```python
import numpy as np

# 规则示例
a = np.ones((4, 3))    # shape (4, 3)
b = np.array([1, 2, 3]) # shape (3,) → (1, 3) → (4, 3)
a + b  # ✅ 合法，b 的 dim=0 为 1，扩展为 4

c = np.ones((4, 1))    # shape (4, 1)
d = np.ones((3,))      # shape (3,) → (1, 3)
c + d  # ✅ 合法，(4,1) + (1,3) → (4,3)

# ❌ 不兼容示例
e = np.ones((4, 3))
f = np.ones((5,))  # 5 ≠ 3 → 报错
```

> ⚠️ **Broadcasting 内存陷阱** — broadcasting 不复制数据，但结果数组会分配完整大小的内存。`(1000,) + (1000, 1000)` 产生 `(1000, 1000)` 的输出。

### 5.5 向量化操作速查

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])

# ---- 通用函数（ufunc） ----
np.sum(a)      # 15
np.mean(a)     # 3.0
np.std(a)      # 标准差
np.min(a), np.max(a)
np.argmin(a), np.argmax(a)
np.cumsum(a)   # [1, 3, 6, 10, 15]
np.percentile(a, 50)  # 中位数

# ---- 逐元素运算 ----
a + 1          # 每个元素 +1
a * 2          # 每个元素 *2
np.sqrt(a)     # 逐元素平方根
np.exp(a)      # 逐元素指数
np.clip(a, 2, 4)  # 限制到 [2, 4]

# ---- 线性代数 ----
A = np.array([[1, 2], [3, 4]])
B = np.array([[1, 0], [0, 1]])
A @ B          # 矩阵乘法（Python 3.5+）
np.dot(A, B)   # 同上
np.linalg.inv(A)    # 矩阵求逆
np.linalg.eig(A)    # 特征值分解
np.linalg.svd(A)    # SVD

# ---- reshape 与转置 ----
arr = np.arange(12).reshape(3, 4)
arr.T         # 转置 — shape (4, 3)
arr.ravel()   # 展平（尽量返回 view）
arr.flatten() # 展平（始终返回 copy）
arr.reshape(-1, 2)  # shape (6, 2)
```

## §6 实现细节 — CPython 内部机制

### 6.1 List 的 resize 策略

CPython `list_resize`（`Objects/listobject.c`）的核心逻辑：

```python
# 模拟 CPython 的 list resize 策略（经典实现简化版）
def list_resize_emulated(new_size, allocated):
    """CPython 风格的扩容计算（经典实现）"""
    # 新分配大小 ≈ new_size + (new_size >> 3) + (3 if new_size < 9 else 6)
    new_allocated = new_size + (new_size >> 3)
    if new_size < 9:
        new_allocated += 3
    else:
        new_allocated += 6
    # CPython 实际还会做按 4 槽位对齐和批量扩展优化
    return new_allocated


# 验证 amortized O(1) — 追踪扩容次数
def count_resizes(n: int) -> int:
    """对 append n 个元素，统计多少次触发扩容"""
    allocated, size = 0, 0
    resizes = 0
    for _ in range(n):
        if size >= allocated:
            allocated = list_resize_emulated(size + 1, allocated)
            resizes += 1
        size += 1
    return resizes


# 扩容次数 ≈ O(log n)，每次 append 的 amortized 开销为 O(1)
print(f"n=100, resizes={count_resizes(100)}")    # ~10
print(f"n=1000, resizes={count_resizes(1000)}")  # ~27
print(f"n=10000, resizes={count_resizes(10000)}") # ~46
```

### 6.2 Dict 哈希查找过程

```python
# CPython dict 查找的简化模拟（开放寻址 + perturb 辅助探测序列）
PERTURB_SHIFT = 5

def dict_lookup_simulated(key, dk_indices, dk_entries, mask):
    """
    模拟 CPython dict __lookup__ 过程。
    dk_indices: 哈希索引表
    dk_entries: 存储 (hash, key, value) 的密集数组
    mask: 哈希表 size - 1
    """
    h = hash(key)
    perturb = h
    i = h & mask  # 初始槽位

    while True:
        entry_idx = dk_indices[i]
        if entry_idx == -1:  # 空槽 — key 不存在
            return None
        stored_hash, stored_key, stored_val = dk_entries[entry_idx]
        if stored_hash == h and stored_key == key:  # 先比较 hash，再比较值
            return stored_val
        # perturb 辅助探测：perturb 持续影响探测序列
        perturb >>= PERTURB_SHIFT
        i = (i * 5 + 1 + perturb) & mask  # 下一个探测位置
```

## §7 常见 Bug 与陷阱

### 7.1 可变默认参数

```python
# ❌ 危险
def add_item(item, target=[]):
    target.append(item)
    return target

add_item(1)  # [1]
add_item(2)  # [1, 2] — 共享同一个 list 对象！

# ✅ 正确
def add_item(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target
```

### 7.2 List 乘法的共享引用

```python
# ❌ 危险的嵌套列表创建
grid = [[0] * 3] * 3
# 看起来：[[0, 0, 0], [0, 0, 0], [0, 0, 0]]
grid[0][0] = 1
# 实际：[[1, 0, 0], [1, 0, 0], [1, 0, 0]] — 三行指向同一对象！

# ✅ 使用推导式
grid = [[0] * 3 for _ in range(3)]
grid[0][0] = 1
# [[1, 0, 0], [0, 0, 0], [0, 0, 0]] ✓
```

### 7.3 迭代时修改容器
```python
# ❌ 错误：直接修改正在迭代的 list
nums = [1, 2, 2, 3, 4]
for x in nums:
    if x == 2:
        nums.remove(x)  # ⚠️ 第二个 2 被跳过！结果 [1, 2, 3, 4] 而非预期的 [1, 3, 4]

# ✅ 方案 1：遍历副本
for x in nums[:]:
    if x % 2 == 0:
        nums.remove(x)

# ✅ 方案 2：列表推导式（推荐）
nums = [x for x in nums if x % 2 != 0]

# ✅ 方案 3：从后往前删除（保留索引正确性）
for i in range(len(nums) - 1, -1, -1):
    if nums[i] % 2 == 0:
        del nums[i]
```

### 7.4 NumPy View vs Copy 陷阱

```python
import numpy as np

# ⚠️ View vs Copy — 最常见的 NumPy 陷阱
a = np.array([1, 2, 3, 4])
b = a[1:3]      # view — b.base is a → True
b[0] = 99       # ⚠️ 修改了 a!
print(a)        # [1, 99, 3, 4]

# copy 明确复制
c = a[1:3].copy()
c[0] = 100
print(a)        # [1, 99, 3, 4] — a 不受影响

# 花式索引总是 copy
d = a[[1, 2]]   # copy — d.base is None → True
```

## §8 时间复杂度对比

| 操作 | list | tuple | dict | set | numpy.ndarray |
|---|---|---|---|---|---|
| **按索引访问** | $O(1)$ | $O(1)$ | — | — | $O(1)$ |
| **按值查找** | $O(n)$ | $O(n)$ | $O(n)$ (按 value) | $O(1)$ avg (按 key) | $O(n)$ |
| **末尾插入** | $O(1)$ amortized | — | — | — | — |
| **任意位置插入** | $O(n)$ | — | — | — | — |
| **插入/更新** | — | — | $O(1)$ avg | — | — |
| **删除（末尾）** | $O(1)$ | — | — | — | — |
| **删除（任意）** | $O(n)$ | — | $O(1)$ avg | — | — |
| **成员检查 `in`** | $O(n)$ | $O(n)$ | $O(1)$ avg | $O(1)$ avg | $O(n)$ |
| **遍历** | $O(n)$ | $O(n)$ | $O(n)$ | $O(n)$ | $O(n)$ |
| **切片** | $O(k)$ (浅拷贝) | $O(k)$ (浅拷贝) | — | — | $O(1)$ (view 元数据) |
| **+ 拼接** | $O(n+m)$ | $O(n+m)$ | — | — | — |
| **逐元素算术** | — | — | — | — | $O(n)$ 向量化 |
| **矩阵乘法** | — | — | — | — | $O(n^3)$ 朴素 |

> ⚠️ **dict 的最坏情况** — 哈希碰撞严重时，dict 查找可退化至 $O(n)$。Python 使用随机化的 `PYTHONHASHSEED` 抵御哈希碰撞攻击（自 Python 3.3 起默认启用）。

## §9 数据结构选择决策树

```
需要 键→值 映射？
├─ 是 → 需要计数？ → Counter
│       └─ 需要默认值？ → defaultdict
│           └─ 其他 → dict
└─ 否 → 需要不可变性 + 哈希？
        ├─ 是 → tuple (可哈希, 内存小)
        └─ 否 → 数值密集计算？
                ├─ 是 → NumPy ndarray (向量化, C 速度)
                └─ 否 → list (通用序列, 灵活)
```

### 9.1 对比速查表

| 场景 | 推荐 | 理由 |
|---|---|---|
| 函数返回多个值 | `tuple` | 隐式打包，调用方解包 |
| 配置参数 | `dict` | 键值对，可嵌套 |
| 坐标/点 | `namedtuple` 或 `tuple` | 不可变，含义清晰 |
| 时序数据 | `list`（小）→ NumPy（大） | 大量数值时 NumPy 占优 |
| 计数器 | `Counter` | 专为此场景优化 |
| LRU Cache | `OrderedDict` | `move_to_end` + `popitem(last=False)` |
| 图的邻接表 | `defaultdict(list)` | 自动初始化 |
| 图像处理 | `numpy.ndarray` | 切片/转换/向量化 |
| 数据库行 | `namedtuple` 或 `dataclass` | 字段命名清晰 |
| 去重 + 保持顺序 | `dict.fromkeys(seq)` | Python 3.7+ dict 保证序 |

## §10 25 高频面试题

### 10.1 L1 — 必会（10 题）

**Q1. list 和 tuple 的核心区别是什么？**

<details><summary>展开答案</summary>

- **可变性**：list 可变（增删改），tuple 不可变（创建后不能修改结构）
- **内存**：tuple 无 over-allocation，内存更小
- **哈希**：tuple 可哈希（若元素全可哈希），可用作 dict key；list 不可哈希
- **语义**：tuple 通常表示异构结构化数据（如坐标），list 表示同构序列

```python
import sys
print(sys.getsizeof([1, 2, 3]))  # ~88 (64-bit CPython)
print(sys.getsizeof((1, 2, 3)))  # ~72 (64-bit CPython)
```
</details>

**Q2. dict 的 key 可以是什么类型？哪些不行？**

<details><summary>展开答案</summary>

必须满足 **hashable**：对象在其生命周期内 `__hash__` 值不变，且定义了 `__eq__`。

- ✅ **可以**：`int`, `float`, `str`, `bytes`, `tuple`（元素全可哈希）, `frozenset`, `None`
- ❌ **不可以**：`list`, `dict`, `set`, 包含可变元素的 `tuple`

```python
# 快速检测
from collections.abc import Hashable
print(isinstance([], Hashable))   # False
print(isinstance((1,), Hashable)) # True
```
</details>

**Q3. 如何合并两个 dict？列出所有方法。**

<details><summary>展开答案</summary>

```python
d1, d2 = {"a": 1}, {"b": 2}

# Python 3.9+: | 运算符（推荐）
d3 = d1 | d2           # {"a": 1, "b": 2}

# Python 3.5+: ** 解包
d3 = {**d1, **d2}

# 通用：update()
d3 = d1.copy(); d3.update(d2)

# 冲突：后者覆盖前者
d1, d2 = {"a": 1}, {"a": 2}
d1 | d2  # {"a": 2}
```
</details>

**Q4. `a = [1, 2, 3]; b = a; b.append(4)` 后 a 是什么？为什么？**

<details><summary>展开答案</summary>

`a = [1, 2, 3, 4]`。`b = a` 创建了一个 **引用**，而非副本。`a` 和 `b` 指向内存中同一个 list 对象。

```python
a = [1, 2, 3]
b = a
b.append(4)
print(a is b)  # True — 同一对象
print(a)       # [1, 2, 3, 4]
```
</details>

**Q5. 如何对 list 去重？保持顺序和不保持顺序的方法分别是什么？**

<details><summary>展开答案</summary>

```python
lst = [3, 1, 2, 1, 3, 4]

# 不保持顺序 — set
deduped = list(set(lst))  # [1, 2, 3, 4] — 顺序不保证

# 保持顺序 — dict (Python 3.7+)
deduped = list(dict.fromkeys(lst))  # [3, 1, 2, 4]

# 保持顺序 — 手动循环
seen = set()
deduped = [x for x in lst if not (x in seen or seen.add(x))]
```
</details>

**Q6. tuple 真的是"不可变"吗？有什么例外？**

<details><summary>展开答案</summary>

tuple 自身结构不可变（不能增删元素、不能重新赋值元素），但 **如果元素是可变对象**，该对象的内部状态可以改变：

```python
t = (1, [2, 3], "hello")
t[1].append(4)  # ✅ 合法 — 修改的是 list 元素，不是 tuple 结构
t[0] = 0        # ❌ TypeError — 修改 tuple 结构
```
</details>

**Q7. NumPy array 和 Python list 相比有什么优势？**

<details><summary>展开答案</summary>

1. **速度**：NumPy 用 C 实现向量化操作，比 Python 循环快 10-200x
2. **内存**：同构类型连续存储，无需存储 PyObject 指针
3. **功能**：支持 broadcasting、花式索引、线性代数等
4. **内存映射**：`np.memmap` 支持磁盘文件直接映射为数组

```python
import numpy as np, time
n = 10_000_000
# Python: ~1s
# NumPy:  ~0.02s
```
</details>

**Q8. `list.sort()` 和 `sorted()` 的区别？**

<details><summary>展开答案</summary>

| | `list.sort()` | `sorted()` |
|---|---|---|
| **操作方式** | 原地排序，修改原 list | 返回新排序的 list |
| **返回值** | `None` | 排序后的新 list |
| **适用范围** | 仅 list | 任何可迭代对象 |
| **性能** | 略快（无需分配新内存） | 需要额外内存 |

```python
lst = [3, 1, 2]
result = lst.sort()   # result = None, lst = [1, 2, 3]
result = sorted(lst)  # result = [1, 2, 3], lst 不变
```
</details>

**Q9. 如何安全地从 dict 中获取可能不存在的 key？**

<details><summary>展开答案</summary>

```python
d = {"a": 1}

# 方法 1：get() — 返回 None 或默认值
val = d.get("z", 0)  # 0

# 方法 2：setdefault() — key 不存在时设置默认值
val = d.setdefault("z", 0)  # 返回 0，同时 d["z"] = 0

# 方法 3：collections.defaultdict — 构造时指定默认工厂
from collections import defaultdict
dd = defaultdict(int)  # 不存在的 key 返回 int() = 0
val = dd["z"]  # 0

# 方法 4：try/except — 适用于 key 大概率存在的情况（EAFP 风格）
try:
    val = d["z"]
except KeyError:
    val = 0
```
</details>

**Q10. 如何展平一个嵌套 list？**

<details><summary>展开答案</summary>

```python
nested = [[1, 2, 3], [4, 5], [6, 7, 8]]

# 一层展平 — 列表推导式
flat = [x for row in nested for x in row]  # [1, 2, 3, 4, 5, 6, 7, 8]

# 一层展平 — itertools.chain
from itertools import chain
flat = list(chain.from_iterable(nested))

# 任意深度展平 — 递归生成器
def flatten(seq):
    for item in seq:
        if isinstance(item, (list, tuple)):
            yield from flatten(item)
        else:
            yield item
```
</details>

### 10.2 L2 — 进阶（10 题）

**Q11. list 的 `append` 为什么是 amortized $O(1)$？推导扩容次数。**

<details><summary>展开答案</summary>

list 通过 **over-allocation** 实现 amortized $O(1)$ 的 append：每次扩容时多分配额外容量，减少扩容频率。

CPython 扩容公式（经典实现）：
$$\text{new\_allocated} \approx \text{new\_size} + (\text{new\_size} \gg 3) + 6$$

对 $n$ 次 append 操作，扩容次数约为 $O(\log n)$（容量指数增长，增长率约 1.125x）。总拷贝开销为：

$$\sum_{i=1}^{\log_{1.125} n} f^i \approx \frac{n}{1 - 1/1.125} = 9n = O(n)$$

因此 $n$ 次 append 总开销 $O(n)$，每次 amortized $O(1)$。
</details>

**Q12. dict 的底层哈希表实现原理是什么？如何处理哈希冲突？**

<details><summary>展开答案</summary>

**核心结构**（Python 3.6+ compact dict）：
- `dk_indices`：`int8` 数组，索引表
- `dk_entries`：密集存储 (hash, key, value) 的数组
- 哈希值对 `dk_indices` 大小取模定位槽位

**冲突解决** — 开放寻址（open addressing），使用 perturb 辅助的二次探测序列（非简单线性探测）：

$$\text{perturb} \gg= 5; \quad \text{index}_{j+1} = (5 \times \text{index}_j + 1 + \text{perturb}) \mathbin{\&} \text{mask}$$

`perturb` 初始为 hash(key)，**每次探测前先右移 5 位**（`perturb >>= 5`），然后用右移后的值计算下一槽位。

**扩容**：当 `used / size > 2/3` 时触发，新 size 翻倍。
</details>

**Q13. `list.insert(0, val)` 和 `list.append(val)` 的时间复杂度分别是多少？为什么？**

<details><summary>展开答案</summary>

- `append` — **$O(1)$ amortized**：尾部插入，无需移动已有元素，仅在触发 resize 时需要 $O(n)$ 拷贝
- `insert(0, val)` — **$O(n)$**：在头部插入，所有 $n$ 个现有元素必须向右移动一位

```python
# deque 更适合在两端频繁插入
from collections import deque
dq = deque()
dq.appendleft("fast")  # O(1)
```

`list.pop()` 是 $O(1)$，但 `list.pop(0)` 是 $O(n)$（所有元素左移）。需要两端操作时用 `collections.deque`。
</details>

**Q14. 为什么 Python 3.7+ 的 dict 保证插入顺序？**

<details><summary>展开答案</summary>

Python 3.6 引入 **compact dict**（受 PyPy 启发，Raymond Hettinger 主导设计，INADA Naoki 实现）。关键改动：

1. `dk_entries` 是一个 **密集数组**，按插入顺序存储 (hash, key, value)
2. `dk_indices` 存储的是 `dk_entries` 的 **索引**，而非键值对本身
3. 遍历 dict 时直接遍历 `dk_entries`，天然按插入顺序

Python 3.6 作为 CPython 实现细节保证了顺序；**Python 3.7 起被正式纳入语言规范**。Java 的 `LinkedHashMap` 通过双向链表维护插入序；C++ 的 `std::map` 默认按 key 排序（红黑树），非插入序。
</details>

**Q15. NumPy 的 broadcasting 规则是什么？举例说明。**

<details><summary>展开答案</summary>

**规则**：从 **最后一个维度向前** 比较两个数组的形状。维度兼容当且仅当：
1. 两维度相等
2. 其中一方为 1（该维度可 broadcast 到另一方的大小）

```python
import numpy as np

# 规则 1: 从最后一维向前对齐
# A (3, 4, 5) + B (4, 5) → B → (1, 4, 5) → (3, 4, 5) 兼容
A = np.ones((3, 4, 5))
B = np.ones((4, 5))
print((A + B).shape)  # (3, 4, 5) ✅

# 规则 2: 维度为 1 时可以展开
# C (3, 1, 5) + D (4, 1) → C → (3, 1, 5), D → (1, 4, 1) → (3, 4, 5) 兼容
C = np.ones((3, 1, 5))
D = np.ones((4, 1))
print((C + D).shape)  # (3, 4, 5) ✅

# 规则 3: 无法对齐则报错
E = np.ones((3, 4))
F = np.ones((5,))  # F → (1, 5) → (3, 4) vs (1, 5) → 4 != 5 ❌
# E + F 会抛出 ValueError

# 实战：标准化每列
X = np.random.randn(100, 50)
X_centered = X - X.mean(axis=0)   # (100,50) - (50,) 兼容 ✅
X_norm = X_centered / X.std(axis=0)
```
</details>

**Q16. list 切片是浅拷贝还是深拷贝？这意味着什么？**

<details><summary>展开答案</summary>

list 切片是 **浅拷贝（shallow copy）**：新 list 的 `ob_item` 指针数组是新分配的，但指针指向的是 **相同的元素对象**。

```python
# 浅拷贝：内层对象共享
a = [[1, 2], [3, 4]]
b = a[:]       # 浅拷贝
b[0].append(99)  # 修改内层 list
print(a)       # [[1, 2, 99], [3, 4]] — a 也变了！
b[0] = [0, 0]  # 修改 b 的第一层指针
print(a)       # [[1, 2, 99], [3, 4]] — a 不变（第一层不同）

# 深拷贝
import copy
c = copy.deepcopy(a)  # 完全独立的副本
```
</details>

**Q17. `defaultdict`、`Counter`、`OrderedDict`、`ChainMap` 分别在什么场景使用？**

<details><summary>展开答案</summary>

| 类型 | 场景 | 示例 |
|---|---|---|
| **defaultdict** | 需要自动为缺失 key 提供默认值 | `defaultdict(list)` 构建邻接表 |
| **Counter** | 计数/频率统计 | `Counter("hello")` → `{'l': 2, 'h': 1, ...}` |
| **OrderedDict** | 需要额外顺序操作（reorder） | LRU Cache 实现 |
| **ChainMap** | 多层配置搜索链 | 命令行参数 > 环境变量 > 默认值 |

```python
from collections import defaultdict, Counter, OrderedDict, ChainMap

# defaultdict — 免去 if key not in d
dd = defaultdict(list)
dd["users"].append("Alice")

# Counter — top-k 频率
cnt = Counter("abracadabra")
print(cnt.most_common(1))  # [('a', 5)]

# OrderedDict — LRU
od = OrderedDict()
od["a"] = 1; od.move_to_end("a")

# ChainMap — 配置覆盖
defaults = {"debug": True, "log": "warn"}
cli = {"log": "error"}
settings = ChainMap(cli, defaults)
settings["log"]  # "error"
```
</details>

**Q18. NumPy 中 view 和 copy 的区别？各举三种产生 view/copy 的操作。**

<details><summary>展开答案</summary>

| | View | Copy |
|---|---|---|
| **定义** | 共享底层数据，仅改变元信息 | 独立分配新内存 |
| **检测** | 当 arr 无底层 base 时，`v.base is arr` | `c.base is None` |
| **修改影响** | 修改 view 影响原数组 | 互不影响 |

**产生 view 的操作**（arr 无底层 base）：
```python
import numpy as np
arr = np.array([[0, 1, 2, 3],
                [4, 5, 6, 7],
                [8, 9, 10, 11]])  # arr.base is None
v1 = arr[:3]         # 基本切片 → view, v1.base is arr
v2 = arr.reshape(-1) # reshape（如可能）→ view
v3 = arr.T           # 转置 → view
```

**产生 copy 的操作**：
```python
import numpy as np
arr = np.array([[0, 1, 2, 3],
                [4, 5, 6, 7],
                [8, 9, 10, 11]])
c1 = arr[[0, 1]]     # 花式索引 → copy, c1.base is None
c2 = arr[arr > 0]    # 布尔索引 → copy
c3 = arr.copy()      # 显式 copy
c4 = arr.flatten()   # flatten 始终返回 copy
```
</details>

**Q19. 什么场景下 tuple 优于 list？给出 3 个具体场景。**

<details><summary>展开答案</summary>

1. **作为 dict key**：tuple 可哈希，list 不可

```python
cache = {(1, 2, 3): "result"}  # ✅
```

2. **函数返回多个值**：隐式 tuple 打包，调用方解包

```python
def get_min_max(arr):
    return min(arr), max(arr)  # 返回 tuple
mn, mx = get_min_max([1, 2, 3])
```

3. **方法参数/配置**：防止意外修改

```python
VALID_COLORS = ("red", "green", "blue")  # 不会被修改
```

4. **内存敏感场景**：tuple 无 over-allocation，比 list 小约 20-30%（64-bit CPython 小容器，具体值依赖版本和元素数）
</details>

**Q20. 如何在迭代 list 时安全删除元素？列出 3 种方法并对比。**

<details><summary>展开答案</summary>

```python
nums = [1, 2, 3, 4, 5, 6]
target = {2, 4, 6}

# 方法 1：列表推导式（最 Pythonic，推荐）
nums = [x for x in nums if x not in target]  # [1, 3, 5]

# 方法 2：倒序删除（原地修改，无需额外内存）
for i in range(len(nums) - 1, -1, -1):
    if nums[i] in target:
        del nums[i]

# 方法 3：filter()（惰性，返回迭代器）
nums = list(filter(lambda x: x not in target, nums))
```

| 方法 | 内存 | 可读性 | 适用场景 |
|---|---|---|---|
| 列表推导式 | 新 list | ⭐⭐⭐ | 通用首选 |
| 倒序删除 | 原地 | ⭐⭐ | 内存受限 |
| filter() | 惰性 | ⭐⭐ | 函数式风格 |
</details>

### 10.3 L3 — 顶级 Lab 面试（5 题）

**Q21. 深入 CPython：list 的 resize 策略是如何实现的？为什么选用约 1.125x 的增长因子？**

<details><summary>展开答案</summary>

**CPython 源码**（`Objects/listobject.c` → `list_resize`，经典实现）：

```c
new_allocated = (size_t)newsize + (newsize >> 3) + 6;  // 简化示意
// 实际实现包含小阈值分支（newsize < 9 ? 3 : 6）和容量按 4 槽位对齐
```

增长因子约 **1.125x**（`>>3` = `/8`），外加常数修正和按 4 槽位对齐。

**为什么是 1.125x？** 相比其他语言更保守的空间-时间权衡：
- 如果因子太小（如 1.01x）：扩容频繁，amortized 常数因子大
- 如果因子太大（如 2x）：可能浪费 ~50% 内存（如 Java ArrayList 的 1.5x）
- CPython 的 1.125x 是针对 Python 小型对象的保守策略，优先节省内存

对比其他语言：
| 语言/实现 | 增长因子 |
|---|---|
| Python list | 1.125x |
| Java ArrayList | 1.5x |
| C++ std::vector (GCC) | 2x |
| Rust Vec | 2x |
| Go slice | 2x (小 slice 时) |
</details>

**Q22. 深入 CPython：compact dict（Python 3.6+）的实现细节是什么？带来什么优化？**

<details><summary>展开答案</summary>

**传统 dict**（Python 3.5 及以前）：
- 每个条目 24 bytes（hash=8 + key_ptr=8 + val_ptr=8）
- 稀疏表：约 1/3 是空槽
- 遍历需要跳过空槽，顺序不确定

**Compact dict**（Python 3.6+，受 PyPy 启发，Raymond Hettinger 主导设计，INADA Naoki 实现）：
- `dk_indices`：`int8`（可升为 `int16/int32/int64`）索引表
- `dk_entries`：密集键值对数组
- 优势：
  1. **内存**：约减少 20-25% 内存（索引表可以用 int8）
  2. **迭代**：直接遍历 `dk_entries`，无需跳过空槽
  3. **Cache locality**：键值对连续存储，缓存友好
  4. **顺序保留**：自然保留插入顺序

```python
# 验证 compact dict 的内存节省
import sys
d = {i: i for i in range(1000)}
print(sys.getsizeof(d))
# Python 3.5: ~49K vs Python 3.7+: ~37K
```
</details>

**Q23. 深入 NumPy：stride 和内存布局（C-order vs F-order）如何影响性能？**

<details><summary>展开答案</summary>

**stride** 是每个维度移动到下一个元素所需的字节数：

```python
import numpy as np

a = np.arange(12).reshape(3, 4).astype(np.float64)
print(a.strides)  # (32, 8) — 行间 32 bytes (4*8)，列间 8 bytes

b = np.array(a, order='F')  # Fortran order
print(b.strides)  # (8, 24) — 列间 24 bytes (3*8)，行间 8 bytes
```

**C-order vs F-order 性能差异**：
```python
import numpy as np, time
n = 5000
a_c = np.random.randn(n, n)          # C-order
a_f = np.array(a_c, order='F')       # F-order

# 按行遍历（row-major 友好）
# C-order: 连续内存，cache 命中率高
# F-order: 跨 stride 访问，cache miss 频繁
```

- **C-order**（默认）：行优先，最后一维 stride 最小 → 按行遍历最快
- **F-order**：列优先 → 按列遍历最快
- NumPy 的 `copy()` 默认转回 C-order
- `np.einsum` 可以指定 `order` 优化特定数值模式
</details>

**Q24. 实现一个 LRU Cache，基于 OrderedDict 或手动构建双向链表+哈希表。**

<details><summary>展开答案</summary>

**方法 1：OrderedDict（最简洁，`get`/`put` 均为 $O(1)$）**：
```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)
```

**方法 2：手动双向链表+哈希表（同样 $O(1)$）**：
```python
class Node:
    __slots__ = ('key', 'val', 'prev', 'next')
    def __init__(self, k=0, v=0):
        self.key, self.val, self.prev, self.next = k, v, None, None

class LRUCacheManual:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.map = {}
        self.head = Node()  # 哨兵头
        self.tail = Node()  # 哨兵尾
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _add_to_head(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)
        self._add_to_head(node)
        return node.val

    def put(self, key, value):
        if key in self.map:
            self._remove(self.map[key])
        node = Node(key, value)
        self._add_to_head(node)
        self.map[key] = node
        if len(self.map) > self.cap:
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]
```
</details>

**Q25. 大规模数据处理时，如何选择 list / array.array / NumPy / Pandas？给出矩阵决策。**

<details><summary>展开答案</summary>

```
数据大小？
├─ < 1K 元素，通用用途 → Python list
│   理由：灵活，异构数据，开销可忽略
│
├─ 1K-100K，纯数值同构 → NumPy ndarray
│   理由：向量化，内存紧凑，科学计算生态
│
├─ 100K-内存/2，数值同构 → NumPy ndarray（memmap 可选）
│   理由：可用 np.memmap 避免全量加载
│
└─ > 内存，或异构表格 → Pandas DataFrame（分块读取）
    理由：chunksize, dtype 优化, 内置 IO

需不需要标签列？
├─ 是 → Pandas DataFrame
└─ 否 → 需不需要存储效率？
         ├─ 是 → array.array（如只需存 int/float）
         └─ 否 → NumPy
```

**关键区别**：
| | list | array.array | NumPy | Pandas |
|---|---|---|---|---|
| **元素类型** | 任意 Python 对象 | C 原生类型 | 固定 dtype | 列级 dtype |
| **向量化** | ❌ | ❌ | ✅ | ✅ |
| **内存紧凑** | ❌ | ✅ | ✅ | ✅ |
| **标签轴** | ❌ | ❌ | ❌ | ✅ |
| **适用规模** | <10K | 10K-1M | 1K-100M+ | 10K-1B+ (分块) |
</details>

## §A 附录

### A.1 关键内置函数速查

| 函数 | list | tuple | dict | 说明 |
|---|---|---|---|---|
| `len(x)` | ✅ | ✅ | ✅ | 元素/键值对数 |
| `x in y` | $O(n)$ | $O(n)$ | $O(1)$ | 成员检查 |
| `enumerate(x)` | ✅ | ✅ | ✅ | (index, item) |
| `zip(a, b)` | ✅ | ✅ | ✅ | 并行迭代 |
| `copy.copy(x)` | 浅拷贝 | 同对象 | 浅拷贝 | tuple 直接返回自身 |

### A.2 推荐阅读

1. CPython 源码 `Objects/listobject.c`, `Objects/dictobject.c`, `Objects/tupleobject.c`
2. Fluent Python, 2nd Edition — Luciano Ramalho (O'Reilly, 2022), Ch.2-3
3. NumPy Documentation — [Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)
4. PEP 468 — Preserving the order of `**kwargs` in a function
5. PEP 509 — Add a private version to dict
