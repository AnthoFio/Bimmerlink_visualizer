/** Hands a file made in the page to the browser's download; nothing leaves the machine. */
export function saveFile(name: string, content: Blob): void {
  const url = URL.createObjectURL(content)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  // Some browsers read the URL after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** The log's name without its extension, for the names of exported files. */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]*$/, '') || 'log'
}
