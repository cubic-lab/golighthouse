# Agent Guidelines

## Commands
- `bun dev` - Start dev server
- `bun run build` - Build and type-check for production
- `bun run type-check` - Run TypeScript type checking with vue-tsc
- `bun run build-only` - Build without type check
- `bun run preview` - Preview production build

## Code Style
- Use TypeScript with Vue 3 Composition API: `<script setup lang="ts">`
- Use Nuxt UI components from `@nuxt/ui` and Tailwind CSS for styling
- Path alias: `@/` maps to `./src/`
- Indentation: 2 spaces, LF line endings, UTF-8 encoding
- No trailing whitespace trimming, no final newline forced
- Naming: PascalCase for components (App.vue), kebab-case for other files
- No ESLint/Prettier configured - follow codebase conventions
- Tests not configured - check parent package for test commands if needed

## References

- You can check https://ui.nuxt.com/llms.txt to learn how to use nuxt ui components.