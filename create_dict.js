const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src-tauri/resources/ecdict-core.db');

// 删除旧文件
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// 创建数据库
const db = new Database(dbPath);

// 创建表
db.exec(`
  CREATE TABLE stardict (
    id INTEGER PRIMARY KEY,
    word TEXT NOT NULL,
    phonetic TEXT,
    translation TEXT NOT NULL,
    pos TEXT,
    exchange TEXT
  );
  CREATE INDEX idx_word ON stardict(word);
`);

// 插入数据
const words = [
  ['hello', '/həˈləʊ/', 'int. 喂；你好 n. 表示问候，惊奇或唤起注意时的用语', 'int.', null],
  ['world', '/wɜːld/', 'n. 世界；领域；世俗；全人类；物质生活', 'n.', null],
  ['think', '/θɪŋk/', 'v. 想；思考；认为；想起；打算', 'v.', 'thought/thinking/thinks/thought'],
  ['cache', '/kæʃ/', 'n. 缓存；贮藏物 v. 隐藏；贮藏', 'n.', 'cached/caching/caches'],
  ['ephemeral', '/ɪˈfemərəl/', 'adj. 短暂的；转瞬即逝的', 'adj.', null],
  ['translate', '/trænsˈleɪt/', 'v. 翻译；转化；解释；转变为', 'v.', 'translated/translating/translates'],
  ['dictionary', '/ˈdɪkʃəneri/', 'n. 字典；词典', 'n.', 'dictionaries'],
  ['computer', '/kəmˈpjuːtə/', 'n. 计算机；电脑；电子计算机', 'n.', 'computers'],
  ['program', '/ˈprəʊɡræm/', 'n. 程序；计划；大纲 v. 编程；制定计划', 'n.', 'programmed/programming/programs'],
  ['function', '/ˈfʌŋkʃn/', 'n. 功能；函数；职责 v. 运行；起作用', 'n.', 'functioned/functioning/functions'],
  ['variable', '/ˈveəriəbl/', 'n. 变量；可变物 adj. 可变的；易变的', 'n.', 'variables'],
  ['string', '/strɪŋ/', 'n. 字符串；线；一串 v. 串起；排成一列', 'n.', 'strung/stringing/strings'],
  ['array', '/əˈreɪ/', 'n. 数组；排列；大批 v. 排列；打扮', 'n.', 'arrayed/arraying/arrays'],
  ['object', '/ˈɒbdʒɪkt/', 'n. 对象；物体；目标 v. 反对；提出异议', 'n.', 'objected/objecting/objects'],
  ['method', '/ˈmeθəd/', 'n. 方法；条理；类函数', 'n.', 'methods'],
  ['class', '/klɑːs/', 'n. 类；班级；阶级 v. 分类', 'n.', 'classed/classing/classes'],
  ['interface', '/ˈɪntəfeɪs/', 'n. 接口；界面 v. 连接；相互作用', 'n.', 'interfaced/interfacing/interfaces'],
  ['module', '/ˈmɒdjuːl/', 'n. 模块；组件；单元', 'n.', 'modules'],
  ['import', '/ɪmˈpɔːt/', 'v. 导入；进口；输入 n. 进口；重要性', 'v.', 'imported/importing/imports'],
  ['export', '/ɪkˈspɔːt/', 'v. 导出；出口；输出 n. 出口；输出品', 'v.', 'exported/exporting/exports'],
  ['error', '/ˈerə/', 'n. 错误；误差；过失', 'n.', 'errors'],
  ['debug', '/diːˈbʌɡ/', 'v. 调试；除错 n. 调试', 'v.', 'debugged/debugging/debugs'],
  ['test', '/test/', 'n. 测试；考验 v. 测试；试验', 'n.', 'tested/testing/tests'],
  ['build', '/bɪld/', 'v. 建造；构建 n. 构建；体格', 'v.', 'built/building/builds'],
  ['server', '/ˈsɜːvə/', 'n. 服务器；服务员', 'n.', 'servers'],
  ['client', '/ˈklaɪənt/', 'n. 客户端；客户；委托人', 'n.', 'clients'],
  ['request', '/rɪˈkwest/', 'n. 请求；需求 v. 请求；要求', 'n.', 'requested/requesting/requests'],
  ['response', '/rɪˈspɒns/', 'n. 响应；回答；反应', 'n.', 'responses'],
  ['data', '/ˈdeɪtə/', 'n. 数据；资料', 'n.', null],
  ['database', '/ˈdeɪtəbeɪs/', 'n. 数据库', 'n.', 'databases'],
];

const insert = db.prepare('INSERT INTO stardict (word, phonetic, translation, pos, exchange) VALUES (?, ?, ?, ?, ?)');
for (const word of words) {
  insert.run(word);
}

db.close();
console.log(`✅ 测试词典创建成功：${words.length} 个单词`);
