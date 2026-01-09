export interface Block {
  toString(): string;
}

export interface Inline {
  toString(): string;
}

//#region Block Nodes

export class ParagraphBlock implements Block {
  constructor(public content: Inline[]) {}

  toString() {
    return `<p>${this.content.join("")}</p>`;
  }
}

export class UnorderedListBlock implements Block {
  constructor(public items: Inline[][]) {}

  toString() {
    const items = this.items.reduce<string>(
      (s, n) => `${s}<li>${n.join("")}</li>`,
      ""
    );

    return `<ul>${items}</ul>`;
  }
}

export class OrderedListBlock implements Block {
  constructor(public items: Inline[][]) {}

  toString() {
    const items = this.items.reduce<string>(
      (s, n) => `${s}<li>${n.join("")}</li>`,
      ""
    );

    return `<ol>${items}</ol>`;
  }
}

export class BlockQuoteBlock implements Block {
  constructor(public content: Block[]) {}

  toString() {
    return `<blockquote>${this.content.join("")}</blockquote>`;
  }
}

export class CodeBlock implements Block {
  constructor(public language: string, public code: string) {}

  toString() {
    return `<pre><code class="language-${this.language}">${this.code}</code></pre>`;
  }
}

export class HeadingBlock implements Block {
  constructor(public level: number, public content: Inline[]) {}

  toString() {
    const tag = `h${this.level}`;
    return `<${tag}>${this.content.join("")}</${tag}>`;
  }
}

export class HorizontalRuleBlock implements Block {
  toString() {
    return `<hr />`;
  }
}

//#endregion

//#region Inline Nodes

export class TextNode implements Inline {
  constructor(public text: string) {}

  toString() {
    return this.text;
  }
}

export class BoldNode implements Inline {
  constructor(public content: Inline[]) {}

  toString(): string {
    return `<strong>${this.content.join("")}</strong>`;
  }
}

export class ItalicNode implements Inline {
  constructor(public content: Inline[]) {}

  toString(): string {
    return `<em>${this.content.join("")}</em>`;
  }
}

export class BreakNode implements Inline {
  toString(): string {
    return `<br />`;
  }
}

export class CodeNode implements Inline {
  constructor(public code: string) {}

  toString(): string {
    return `<code>${this.code}</code>`;
  }
}

export class LinkNode implements Inline {
  constructor(public text: string, public url: string) {}

  toString(): string {
    return `<a href="${this.url}">${this.text}</a>`;
  }
}

//#endregion
