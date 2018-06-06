# Solidity Sapper
Tools that makes Solidity and JS interface compile with ease.

# Install
```
yarn
```

# Usage
Via cli:
```
dist/index.js --help
```


# Note
In `tsconfig.json` there is used `include` directive instead of (prefered) `"files": ["src/index.ts"]`.
The reason is strange behaviour when depending on this project via npm -> in such case it compiled
only `src/index.ts` but didn't follow ts import(inconsistency vs building this project on itself = bug).