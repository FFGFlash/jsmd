import {
  PARAGRAPH_NORMALIZE_HOOK,
  type EmitHook,
  type Emittable,
} from "./hooks.js";
import { ParagraphBlock, TextNode, type Block, type Inline } from "./nodes.js";
import {
  BLOCK_QUOTE_RULE,
  type BlockRule,
  BoldRule,
  BREAK_RULE,
  CODE_BLOCK_RULE,
  CODE_RULE,
  HEADING_RULE,
  HORIZONTAL_RULE_RULE,
  type InlineRule,
  ItalicRule,
  LINK_RULE,
  ORDERED_LIST_RULE,
  UNORDERED_LIST_RULE,
} from "./rules.js";

export class MarkdownParser {
  blockRules = new Set<BlockRule>();
  inlineRules = new Set<InlineRule>();
  emitHooks = new Set<EmitHook>();

  withDefaults() {
    return this.withDefaultRules().withDefaultHooks();
  }

  withDefaultRules() {
    return this.addBlockRule(HORIZONTAL_RULE_RULE)
      .addBlockRule(HEADING_RULE)
      .addBlockRule(CODE_BLOCK_RULE)
      .addBlockRule(BLOCK_QUOTE_RULE)
      .addBlockRule(UNORDERED_LIST_RULE)
      .addBlockRule(ORDERED_LIST_RULE)
      .addInlineRule(new BoldRule("**"))
      .addInlineRule(new BoldRule("__"))
      .addInlineRule(new ItalicRule("*"))
      .addInlineRule(new ItalicRule("_"))
      .addInlineRule(CODE_RULE)
      .addInlineRule(LINK_RULE)
      .addInlineRule(BREAK_RULE);
  }

  withDefaultHooks() {
    return this.addEmitHook(PARAGRAPH_NORMALIZE_HOOK);
  }

  addBlockRule(rule: BlockRule) {
    this.blockRules.add(rule);
    return this;
  }

  addInlineRule(rule: InlineRule) {
    this.inlineRules.add(rule);
    return this;
  }

  addEmitHook(hook: EmitHook) {
    this.emitHooks.add(hook);
    return this;
  }

  parseToHTML(text: string) {
    return this.parse(text).join("");
  }

  parse(text: string) {
    const result: Block[] = [];
    let lines = text.split("\n");
    let i = 0;

    const rules = Array.from(this.blockRules);

    main: while (i < lines.length) {
      let line = lines[i].trimEnd();
      if (line.length === 0) {
        i += 1;
        continue;
      }

      for (let rule of rules) {
        if (!rule.matches(lines, i)) continue;
        const parsed = rule.parse(lines, i, this);
        if (!parsed) continue;
        const [block, newIndex] = parsed;
        this.#emit(result, block, rule);
        i = newIndex;
        continue main;
      }

      let paraLines = [];
      while (i < lines.length) {
        let l = lines[i];
        if (l.length === 0) break;

        if (rules.some((r) => r.matches(lines, i))) break;

        paraLines.push(l);
        i += 1;
      }
      if (paraLines.length === 0) continue;

      let text = paraLines.join("\n");
      this.#emit(result, new ParagraphBlock(this.parseInline(text)));
    }

    return result;
  }

  parseInline(text: string) {
    const result: Inline[] = [];
    const chars = text.split("");
    let i = 0;

    const rules = Array.from(this.inlineRules);

    main: while (i < chars.length) {
      for (let rule of rules) {
        if (!rule.matches(chars, i)) continue;
        const parsed = rule.parse(chars, i, this);
        if (!parsed) continue;
        const [inline, newIndex] = parsed;
        this.#emit(result, inline, rule);
        i = newIndex;
        continue main;
      }

      let textChars = [];
      while (i < chars.length) {
        if (rules.some((r) => r.matches(chars, i))) break;

        textChars.push(chars[i]);
        i += 1;
      }
      if (textChars.length === 0) continue;

      this.#emit(result, new TextNode(textChars.join("")));
    }

    return result;
  }

  #emit<T extends Block | Inline>(output: T[], node: T, rule?: Emittable<T>) {
    if (rule != null) {
      rule.onEmit?.(node, output);
    }
    for (let hook of this.emitHooks) {
      hook(node, output);
    }
    output.push(node);
  }
}
