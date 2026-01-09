import { findChar, findClosing } from "./helpers.js";
import type { Emittable } from "./hooks.js";
import { MarkdownParser } from "./index.js";
import {
  type Block,
  BlockQuoteBlock,
  BoldNode,
  BreakNode,
  CodeBlock,
  CodeNode,
  HeadingBlock,
  HorizontalRuleBlock,
  type Inline,
  ItalicNode,
  LinkNode,
  OrderedListBlock,
  TextNode,
  UnorderedListBlock,
} from "./nodes.js";

//#region Block Rules

export interface BlockRule extends Emittable<Block> {
  matches(lines: string[], index: number): boolean;
  parse(
    lines: string[],
    index: number,
    parser: MarkdownParser
  ): [Block, number] | null;
}

export interface InlineRule extends Emittable<Inline> {
  matches(chars: string[], index: number): boolean;
  parse(
    chars: string[],
    index: number,
    parser: MarkdownParser
  ): [Inline, number] | null;
}

export const UNORDERED_LIST_RULE: BlockRule = {
  matches(lines, index) {
    const trimmed = lines[index].trimStart();
    return trimmed.startsWith("- ") || trimmed.startsWith("* ");
  },
  parse(lines, index, parser) {
    const items = [];
    while (index < lines.length) {
      const l = lines[index].trimStart();
      if (l.length === 0 || (!l.startsWith("- ") && !l.startsWith("* "))) break;
      const content = l.slice(2).trim();
      items.push(parser.parseInline(content));
      index += 1;
    }
    return [new UnorderedListBlock(items), index];
  },
};

const OrderedListMarker = /^(\d+?)\. /;
export const ORDERED_LIST_RULE: BlockRule = {
  matches(lines, index) {
    const match = lines[index].trimStart().match(OrderedListMarker);
    return match != null;
  },
  parse(lines, index, parser) {
    const items = [];
    while (index < lines.length) {
      const l = lines[index].trimStart();
      if (l.length === 0) break;
      const match = l.match(OrderedListMarker);
      if (match == null) break;
      const content = l.slice(match.index! + match[0].length).trim();
      items.push(parser.parseInline(content));
      index += 1;
    }
    return [new OrderedListBlock(items), index];
  },
};

export const BLOCK_QUOTE_RULE: BlockRule = {
  matches(lines, index) {
    return lines[index].startsWith(">");
  },
  parse(lines, index, parser) {
    const quoteLines: string[] = [];
    while (index < lines.length && lines[index].trimStart().startsWith(">")) {
      let content = lines[index].trimStart().replace(/^>+/, "").trim();
      quoteLines.push(content);
      index += 1;
    }
    let quote_text = quoteLines.join("\n");
    return [new BlockQuoteBlock(parser.parse(quote_text)), index];
  },
};

export const HORIZONTAL_RULE_RULE: BlockRule = {
  matches(lines, index) {
    const line = lines[index];
    return line.startsWith("---") || line.startsWith("***");
  },
  parse(_, index) {
    index += 1;
    return [new HorizontalRuleBlock(), index];
  },
};

export const CODE_BLOCK_RULE: BlockRule = {
  matches(lines, index) {
    return lines[index].startsWith("```");
  },
  parse(lines, index) {
    const lang = lines[index].slice(3).trim();
    index += 1;
    const codeLines = [];
    while (index < lines.length && !lines[index].startsWith("```")) {
      codeLines.push(lines[index]);
      index += 1;
    }
    index += 1;
    return [new CodeBlock(lang, codeLines.join("\n")), index];
  },
};

export const HEADING_RULE: BlockRule = {
  matches(lines, index) {
    return lines[index].startsWith("#");
  },
  parse(lines, index, parser) {
    const line = lines[index];
    const level = line.match(/^#+/)?.[0].length ?? 0;
    if (level === 0 || level > 6) return null;
    const text = line.slice(level).trim();
    index += 1;
    return [new HeadingBlock(level, parser.parseInline(text)), index];
  },
};

//#endregion

//#region Inline Rules

export class BoldRule implements InlineRule {
  constructor(public marker: string) {}

  matches(chars: string | any[], index: number) {
    if (index + this.marker.length > chars.length) return false;
    for (let i = 0; i < this.marker.length; i++) {
      if (chars[index + i] !== this.marker[i]) return false;
    }
    return true;
  }

  parse(
    chars: string[],
    index: number,
    parser: MarkdownParser
  ): [Inline, number] | null {
    const end = findClosing(chars, index + this.marker.length, this.marker);
    if (end == null) return null;
    const content = chars.slice(index + this.marker.length, end).join("");
    return [
      new BoldNode(parser.parseInline(content)),
      end + this.marker.length,
    ];
  }
}

export class ItalicRule implements InlineRule {
  constructor(public marker: string) {}

  matches(chars: string | any[], index: number) {
    if (index + this.marker.length > chars.length) return false;
    for (let i = 0; i < this.marker.length; i++) {
      if (chars[index + i] !== this.marker[i]) return false;
    }
    return true;
  }

  parse(
    chars: string[],
    index: number,
    parser: MarkdownParser
  ): [Inline, number] | null {
    const end = findClosing(chars, index + this.marker.length, this.marker);
    if (end == null) return null;
    const content = chars.slice(index + this.marker.length, end).join("");
    return [
      new ItalicNode(parser.parseInline(content)),
      end + this.marker.length,
    ];
  }
}

export const CODE_RULE: InlineRule = {
  matches(chars, index) {
    return chars[index] === "`";
  },
  parse(chars, index) {
    const end = findClosing(chars, index + 1, "`");
    if (end == null) return null;
    const content = chars.slice(index + 1, end).join("");
    return [new CodeNode(content), end + 1];
  },
};

export const LINK_RULE: InlineRule = {
  matches(chars, index) {
    return chars[index] === "[";
  },
  parse(chars, index) {
    const textEnd = findChar(chars, index + 1, "]");
    if (
      textEnd === -1 ||
      textEnd + 1 >= chars.length ||
      chars[textEnd + 1] !== "("
    )
      return null;
    const urlEnd = findChar(chars, textEnd + 2, ")");
    if (urlEnd === -1) return null;
    const text = chars.slice(index + 1, textEnd).join("");
    const url = chars.slice(textEnd + 2, urlEnd).join("");
    return [new LinkNode(text, url), urlEnd + 1];
  },
};

export const BREAK_RULE: InlineRule = {
  matches(chars, index) {
    if (chars[index] !== "\n") return false;
    if (index >= 1 && chars[index - 1] === "\\") return true;
    if (index >= 2 && chars[index - 1] === " " && chars[index - 2] === " ")
      return true;
    return false;
  },
  parse(_, index) {
    return [new BreakNode(), index + 1];
  },
  onEmit(_, output) {
    const last = output.at(-1);
    if (last == null || !(last instanceof TextNode)) return;
    last.text = last.text.trimEnd().replace(/\\$/, "");
  },
};

//#endregion
