import { MarkdownParser } from "./index.js";

const parser = new MarkdownParser().withDefaults();

const blocks = parser.parse(`
# Hello World!

This is a _markdown_ file that is being **parsed**!

## lists

- Item 1
- Item 2
- Item 3

1. First
2. Second
3. Third

---

> Isn't this amazing?!
> Like awesome even!

### Testing!
`);

console.log(blocks.join(""));
