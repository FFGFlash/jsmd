import { ParagraphBlock, TextNode, type Block, type Inline } from "./nodes.js";

export type EmitHook<T extends Block | Inline = Block | Inline> = (
  emitted: T,
  output: T[]
) => void;

export interface Emittable<T extends Block | Inline> {
  onEmit?: EmitHook<T>;
}

export const PARAGRAPH_NORMALIZE_HOOK: EmitHook = (emitted) => {
  if (!(emitted instanceof ParagraphBlock)) return;
  for (let inline of emitted.content) {
    if (inline instanceof TextNode) {
      inline.text = inline.text.replace(/\n/g, " ");
    }
  }
};
