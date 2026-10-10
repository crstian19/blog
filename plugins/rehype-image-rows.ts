import type { Element, Parent, Root } from 'hast'

const isImage = (node: Root['children'][number]): node is Element => node.type === 'element' && node.tagName === 'img'
const isBlank = (node: Root['children'][number]) => node.type === 'text' && node.value.trim() === ''

/**
 * Images written next to each other on one Markdown line (`![a](x) ![b](y)`)
 * are wrapped in `<div class="image-row">`, so they render side by side, e.g.
 * for before/after comparisons. Runs after rehype-unwrap-images.
 */
export default function rehypeImageRows() {
  const walk = (parent: Parent) => {
    const out: Parent['children'] = []
    let i = 0
    while (i < parent.children.length) {
      const node = parent.children[i]
      if (isImage(node)) {
        const run: Element[] = [node]
        let j = i + 1
        while (j < parent.children.length && (isImage(parent.children[j]) || isBlank(parent.children[j]))) {
          if (isImage(parent.children[j])) run.push(parent.children[j] as Element)
          j++
        }
        if (run.length > 1) {
          out.push({ type: 'element', tagName: 'div', properties: { className: ['image-row'] }, children: run })
          i = j
          continue
        }
      }
      if ('children' in node) walk(node as Parent)
      out.push(node)
      i++
    }
    parent.children = out
  }
  return (tree: Root) => walk(tree)
}
