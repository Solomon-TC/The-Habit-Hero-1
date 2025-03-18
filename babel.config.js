// This file is only used when SWC is disabled
const babel = {
  presets: ["next/babel"],
  plugins: ["@babel/plugin-syntax-import-attributes"],
};

if (process.env.NEXT_PUBLIC_TEMPO) {
  babel.plugins.push("tempo-devtools/dist/babel-plugin");
}

module.exports = babel;
