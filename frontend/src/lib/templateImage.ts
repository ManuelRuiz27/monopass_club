const MAX_TEMPLATE_DIMENSION = 1600
const JPEG_QUALITY = 0.82

function fitInsideBounds(width: number, height: number, maxDimension: number) {
  const largestSide = Math.max(width, height)
  if (largestSide <= maxDimension) {
    return { width, height }
  }

  const ratio = maxDimension / largestSide
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function loadImage(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'))
    image.src = sourceUrl
  })
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'))
    reader.readAsDataURL(file)
  })
}

export async function optimizeTemplateImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Archivo de imagen invalido.')
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const { width, height } = fitInsideBounds(image.naturalWidth, image.naturalHeight, MAX_TEMPLATE_DIMENSION)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('No se pudo preparar la imagen seleccionada.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    }

    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
