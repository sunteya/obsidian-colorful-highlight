import { Plugin } from 'obsidian'
import { syntaxTree } from "@codemirror/language"
import {
  Extension,
  RangeSetBuilder,
  StateField,
  Transaction,
} from "@codemirror/state"
import {
  Decoration,
  DecorationSet,
  EditorView,
} from "@codemirror/view"

import { Md5 as MD5 } from 'ts-md5';

function colorfulStyle(text: string): { [x in string]: string } {
	const sum = MD5.hashStr(text, true).reduce((a, b) => a + b, 0)
	const deg = Math.abs(sum) % 900 / 10 * 4
	return { filter: `hue-rotate(${deg}deg)` }
}

export const ColorfulHighlightField = StateField.define<DecorationSet>({
  create(state): DecorationSet {
    return Decoration.none
  },

  update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    syntaxTree(transaction.state).iterate({
      enter(node) {
        if (node.name.includes("highlight")) {
					const from = node.from
					const to = node.to
					const text = transaction.state.doc.sliceString(from, to)

          builder.add(
            from,
            to,
            Decoration.mark({
							class: "cm-highlight",
							attributes: {
								style: Object.entries(colorfulStyle(text)).map(([k, v]) => `${k}: ${v}`).join(';')
							}
            })
          );
        }
      },
    })

    return builder.finish()
  },

  provide(field: StateField<DecorationSet>): Extension {
    return EditorView.decorations.from(field)
  },
})

export default class ColorfulHighlightPlugin extends Plugin {
	async onload() {
		this.registerMarkdownPostProcessor((element, context) => {
      const marks = element.querySelectorAll("mark");

      for (let index = 0; index < marks.length; index++) {
        const mark = marks.item(index)
        const text = mark.innerText.trim()
				Object.assign(mark.style, colorfulStyle(text))
      }
    })

		this.registerEditorExtension(ColorfulHighlightField)
	}
}
