import { useState } from 'react'
import { baseName, saveFile } from '../../components/download.ts'

const PNG_SCALE = 2

interface Props {
  fileName: string
  /** The SVG of the charts as they are now, made at the click. */
  svg: () => { text: string; width: number; height: number }
}

/** Renders the SVG again at twice the size: a true 2x image, not an enlarged screenshot. */
async function toPng(svg: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width * PNG_SCALE
    canvas.height = height * PNG_SCALE
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No canvas')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No PNG'))), 'image/png'),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function ImageExport({ fileName, svg }: Props) {
  const [problem, setProblem] = useState<string>()
  const name = baseName(fileName)

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          setProblem(undefined)
          const { text, width, height } = svg()
          try {
            saveFile(`${name}.png`, await toPng(text, width, height))
          } catch {
            setProblem('The image could not be made. Try the SVG export.')
          }
        }}
      >
        Export PNG
      </button>
      <button
        type="button"
        onClick={() => saveFile(`${name}.svg`, new Blob([svg().text], { type: 'image/svg+xml' }))}
      >
        Export SVG
      </button>
      {problem && (
        <span role="alert" className="inline-error">
          {problem}
        </span>
      )}
    </>
  )
}
