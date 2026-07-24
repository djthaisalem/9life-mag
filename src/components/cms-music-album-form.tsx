'use client'

import { Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ArtistOption = { id: string; name: string }
type TrackOption = { id: string; title: string; artist: string; type: string; duration: string }

export function CmsMusicAlbumForm({ artists, tracks }: { artists: ArtistOption[]; tracks: TrackOption[] }) {
  const router = useRouter()
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  function toggleTrack(trackId: string) {
    setSelectedTrackIds((current) => current.includes(trackId)
      ? current.filter((id) => id !== trackId)
      : [...current, trackId])
  }

  async function createAlbum(form: HTMLFormElement) {
    if (!selectedTrackIds.length) {
      setIsError(true)
      setMessage('Select at least one track for this Album / EP.')
      return
    }

    const formData = new FormData(form)
    setIsPending(true)
    setIsError(false)
    setMessage('Creating Album / EP...')

    try {
      const releaseDate = String(formData.get('releaseDate') ?? '')
      const response = await fetch('/api/cms/music/albums', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(formData.get('title') ?? ''),
          description: String(formData.get('description') ?? ''),
          artistId: String(formData.get('artistId') ?? ''),
          musician: String(formData.get('musician') ?? ''),
          musicCategory: String(formData.get('musicCategory') ?? ''),
          releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
          isPublic: formData.get('isPublic') === 'on',
          trackIds: selectedTrackIds,
        }),
      })
      const result = await response.json() as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message || 'Unable to create Album / EP.')

      setMessage(result.message || 'Album / EP created.')
      window.setTimeout(() => router.push('/cms/dashboard/music?tab=album'), 600)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : 'Unable to reach the Album / EP service.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="form-shell cms-embedded-form" onSubmit={(event) => { event.preventDefault(); void createAlbum(event.currentTarget) }}>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="albumTitle">Album / EP title</label><input id="albumTitle" name="title" required maxLength={180} placeholder="Example: After Midnight EP" /></div>
        <div className="field"><label htmlFor="albumArtist">Release artist</label><select id="albumArtist" name="artistId" defaultValue=""><option value="">No artist selected</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></div>
      </div>
      <div className="cms-form-two">
        <div className="field"><label htmlFor="albumCategory">Format / category</label><input id="albumCategory" name="musicCategory" maxLength={120} placeholder="Album, EP, Mixtape or DJ set" /></div>
        <div className="field"><label htmlFor="albumReleaseDate">Release date</label><input id="albumReleaseDate" name="releaseDate" type="date" /></div>
      </div>
      <div className="field"><label htmlFor="albumMusician">Display credit</label><input id="albumMusician" name="musician" maxLength={160} placeholder="Optional when an artist is selected above" /></div>
      <div className="field"><label htmlFor="albumDescription">Album / EP description</label><textarea id="albumDescription" name="description" maxLength={1200} placeholder="A concise summary of the release, concept, and sound." /></div>
      <label className="cms-checkbox-row"><input name="isPublic" type="checkbox" />Publish immediately after creation</label>

      <div className="artist-album-track-picker">
        <div className="artist-album-track-picker-head"><span>Uploaded track library</span><strong>{selectedTrackIds.length} selected</strong></div>
        <div className="artist-album-track-list">
          {tracks.map((track, index) => {
            const isSelected = selectedTrackIds.includes(track.id)
            return <article key={track.id} className={isSelected ? 'is-selected' : ''}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{track.title}</strong><small>{track.artist} · {track.type} · {track.duration}</small></div>
              <button type="button" onClick={() => toggleTrack(track.id)} aria-label={`${isSelected ? 'Remove' : 'Add'} ${track.title}`}>{isSelected ? <Minus size={16} /> : <Plus size={16} />}</button>
            </article>
          })}
          {!tracks.length ? <p className="cms-muted">No uploaded tracks are available yet. Upload a track before creating an Album / EP.</p> : null}
        </div>
      </div>

      <div className="cms-inline-actions"><button type="submit" className="button" disabled={isPending || !tracks.length}>{isPending ? 'Creating...' : 'Create Album / EP'}</button></div>
      {message ? <p className={isError ? 'cms-form-message cms-form-message-error' : 'cms-form-message'} role="status">{message}</p> : null}
    </form>
  )
}
