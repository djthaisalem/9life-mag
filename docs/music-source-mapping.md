# Music Source Mapping

Nguon cu trong `E:\SOURCE` dang cho thay 3 nhom du lieu chinh:

- `tbl_Music`: bai nhac, remix, file preview, file full, thong tin singer/remixer, tempo, share code
- `tbl_PlayList`: playlist, image, slug, singer, musician, release date, featured/vip
- `tbl_Album`: album, artist, musician, presenter, category, release date

Trong du an moi `9life-mag`, minh da map sang cac collection Payload:

- `tracks`
- `playlists`
- `albums`

Quy uoc de dua du lieu cu sang:

- `tbl_Music.Title` -> `tracks.title`
- `tbl_Music.Slug` -> `tracks.slug`
- `tbl_Music.Image` -> `tracks.coverImage`
- `tbl_Music.Description` -> `tracks.description`
- `tbl_Music.MixedInKey` -> `tracks.mixedInKey`
- `tbl_Music.Tempo` -> `tracks.tempo`
- `tbl_Music.DateRelease` -> `tracks.releaseDate`
- `tbl_Music.FileTrial` -> `tracks.previewFile`
- `tbl_Music.FileFull` -> `tracks.fullFile`
- `tbl_Music.IsFeature` -> `tracks.isFeatured`
- `tbl_Music.IsPublic` -> `tracks.isPublic`
- `tbl_Music.IsOfficial` -> `tracks.isOfficial`
- `tbl_Music.ShareCode` -> `tracks.shareCode`

- `tbl_PlayList.Title` -> `playlists.title`
- `tbl_PlayList.Slug` -> `playlists.slug`
- `tbl_PlayList.Image` -> `playlists.coverImage`
- `tbl_PlayList.Description` -> `playlists.description`
- `tbl_PlayList.ReleaseDate` -> `playlists.releaseDate`
- `tbl_PlayList.Tempo` -> `playlists.tempo`
- `tbl_PlayList.IsVip` -> `playlists.isVip`
- `tbl_PlayList.IsFeature` -> `playlists.isFeatured`
- `tbl_PlayList.IsPublic` -> `playlists.isPublic`

- `tbl_Album.Title` -> `albums.title`
- `tbl_Album.Slug` -> `albums.slug`
- `tbl_Album.Image` -> `albums.coverImage`
- `tbl_Album.Description` -> `albums.description`
- `tbl_Album.ReleaseDate` -> `albums.releaseDate`
- `tbl_Album.IsFeature` -> `albums.isFeatured`
- `tbl_Album.IsPublic` -> `albums.isPublic`

Huong dua file vao du an:

1. Upload anh cover va file audio vao collection `media`.
2. Tao artist truoc neu can gan track/album voi nghe si.
3. Tao `tracks` cho tung bai nhac hoac remix.
4. Gom cac track vao `playlists` hoac `albums`.
5. Homepage va player se doc tu CMS o buoc ket noi tiep theo.

Neu muon nhap hang loat tu `E:\SOURCE`, buoc sau minh co the viet them mot script import de doc data cu va tu dong tao ban ghi Payload.
