import type { DocPage } from '@/types/document'

type Loose = Record<string, unknown>

/**
 * The page as it should be printed professionally. A picture made editable keeps its texts hidden until they are touched
 * (`ghost`, with a clean patch each, `ghostFor`). In print every one of them goes live: the patch covers the blurred letters of the
 * picture and the text above it is real vector text, so letters are sharp at any size and stay editable in CorelDRAW.
 * The document itself is not changed.
 */
export function printReadyPage(page: DocPage): DocPage {
  const revealed = (page.objects as unknown as Loose[]).map((object) => {
    if (object.ghost !== true && typeof object.ghostFor !== 'string') return object
    const { ghost: _ghost, ...rest } = object
    return { ...rest, opacity: 1 }
  })
  return { ...page, objects: revealed as unknown as DocPage['objects'] }
}

/** How many texts a page keeps hidden until edited (they all print as live text in the professional PDF). */
export function hiddenTextCount(page: DocPage): number {
  return (page.objects as unknown as Loose[]).filter((object) => object.ghost === true).length
}
