# What is this?

Node.js loader that prevents to resolve symlinks in "imports" in "package.json".


# How to use
```bash
pnpm add github:chrono-meter/node-symlink-loader
# or
pnpm add github:chrono-meter/node-symlink-loader#v0.1.0

# Then
node --import @chrono-meter/node-symlink-loader/install ./script.mjs
tsx --import @chrono-meter/node-symlink-loader/install ./script.ts
```
