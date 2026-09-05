const fs = require('fs');

const sourcePath = 'typing_materials.json';
const outputPath = 'typing_materials.js';
const checkOnly = process.argv.includes('--check');
let hasErrors = false;

function fail(message) {
  console.error(message);
  hasErrors = true;
}

const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const { items } = data;

if (!Array.isArray(items)) {
  fail('items must be an array');
} else {
  if (data.count !== items.length) {
    fail(`count is ${data.count}, but items contains ${items.length} entries`);
  }

  const commands = new Set();
  const descriptions = new Set();
  const contextWords = /上一题|下一题|上一条|下一条|上一行命令|继续上一/;
  const pdbTemplate = /^(?:s\(tep\)|n\(ext\)|c\(ont|r\(eturn|unt\(il|b\(reak|cl\(ear|w\(here|u\(p|d\(own|l\(ist|a\(rgs|h\(elp|q\(uit)/;

  items.forEach((entry, index) => {
    const label = `item ${index + 1}`;
    const command = entry.command || '';
    const description = entry.description || '';

    if (!command || !description) fail(`${label} has an empty command or description`);
    if (/[\r\n]/.test(command) || /\\\s*$/.test(command)) fail(`${label} is not a complete single-line command`);
    if (contextWords.test(description)) fail(`${label} depends on neighboring items`);
    if (command.includes(' / ')) fail(`${label} contains multiple candidate commands`);
    if (command.includes('...') || /<[^>]+>/.test(command) || pdbTemplate.test(command)) fail(`${label} contains template notation`);
    if (command.includes('"') && !description.includes('双引号')) fail(`${label} does not describe its double quotes`);
    if (command.includes("'") && !description.includes('单引号')) fail(`${label} does not describe its single quotes`);
    if (command.includes(' | ') && !description.includes('管道')) fail(`${label} does not describe its pipeline`);
    if (command.includes(' && ') && !description.includes('&&')) fail(`${label} does not describe its && operator`);
    if (command.includes(';') && !description.includes('分号')) fail(`${label} does not describe its semicolon`);
    if (commands.has(command)) fail(`${label} duplicates command: ${command}`);
    if (descriptions.has(description)) fail(`${label} duplicates a description`);

    commands.add(command);
    descriptions.add(description);
  });
}

const output = `// Generated from ${sourcePath}. Run node generate_typing_materials.js after editing the source.\nwindow.TYPING_MATERIALS = ${JSON.stringify(data, null, 2)};\n`;

if (hasErrors) {
  process.exit(1);
} else if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) {
    fail(`${outputPath} is not synchronized with ${sourcePath}`);
  }
} else {
  fs.writeFileSync(outputPath, output, 'utf8');
}

if (!hasErrors) {
  console.log(`${checkOnly ? 'validated' : 'generated'} ${items.length} items`);
}
