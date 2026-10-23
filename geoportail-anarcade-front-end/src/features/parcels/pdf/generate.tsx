import type { ParcelDetail } from '../useParcelDetail'

// Télécharge la photo et la convertit en image que le PDF sait lire (JPEG ou PNG).
// Retourne null au moindre problème : le PDF affichera alors une silhouette.
async function loadPhoto(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null

    // JPEG et PNG passent tels quels ; les autres formats (WebP…) sont redessinés en PNG
    if (/^image\/(jpe?g|png)$/.test(blob.type)) {
      return await new Promise((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => resolve(null)
        r.readAsDataURL(blob)
      })
    }
    const bmp = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bmp.width
    canvas.height = bmp.height
    canvas.getContext('2d')?.drawImage(bmp, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export async function downloadParcelPdf(d: ParcelDetail) {
  // Chargement à la demande : la bibliothèque PDF n'alourdit pas la carte
  const [{ pdf }, { default: ParcelPdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./ParcelPdf'),
  ])

  const photo = d.exploitant.photo_url ? await loadPhoto(d.exploitant.photo_url) : null

  const blob = await pdf(
    <ParcelPdf d={d} photo={photo} generatedAt={new Date()} />,
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiche_parcelle_${d.parcelle.code}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}