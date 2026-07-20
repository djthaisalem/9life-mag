export const cmsLoginHighlights = [
  'ng nh�p qu�n tr� t�ch bi�t kh�i t�i kho�n c�ng �ng � gi�m nh�m l�n v� d� ki�m so�t quy�n.',
  'Lu�ng quay l�i trang ch�nh lu�n hi�n th� r� n�u ng��i d�ng b�m nh�m v�o khu CMS.',
  'B�o m�t v�n h�nh t�p trung v�o ph�n quy�n, session an to�n, nh�t k� thao t�c v� ki�m so�t c�c h�nh �ng nh�y c�m.',
]

export const cmsSecurityLayers = [
  'Admin, bi�n t�p, artist ops, music ops v� finance ops n�n d�ng t�i kho�n ri�ng v�i m�t kh�u m�nh v� 2FA.',
  'API ��c t�ch theo nh�m d� li�u � m�i vai tr� ch� nh�n th�y v� ch�nh ��c �ng ph�n vi�c c�a m�nh.',
  'C�c thao t�c duy�t ngh� s), ch�nh sao, �i quy�n profile, duy�t b�i v� qu�n l� file �u c�n c� audit log.',
  'Media upload n�n i qua backend k� quy�n tr��c khi �y l�n Cloudflare R2 � tr�nh l� secret � ph�a client.',
]

export const cmsModules = [
  {
    title: 'Qu�n l� b�i vi�t',
    description:
      'T�o b�i, x�p chuy�n m�c, g�n chuy�n �, ch�n v� tr� hi�n th� ngo�i site, t�i �u SEO v� ki�m so�t l�ch l�n b�i t� m�t n�i.',
    metrics: ['128 b�i ang live', '14 b�i ch� duy�t', '6 chi�n d�ch n�i b�t'],
  },
  {
    title: 'Artist registry',
    description:
      'Duy�t ngh� s) m�i ng k�, so kh�p v�i profile c� s�n, chuy�n quy�n v� ngh� s) ho�c agent v� ki�m so�t tr�ng th�i public.',
    metrics: ['42 h� s� ch� x�t', '11 profile c� th� match', '7 agent ang qu�n l�'],
  },
  {
    title: 'Music vault',
    description:
      'Qu�n l� track, nonstop, remix, playlist, premium release, quy�n t�i v� to�n b� metadata tr��c khi �a ra player ngo�i site.',
    metrics: ['392 file �m nh�c', '23 file c�n ki�m tra', '5 release premium'],
  },
  {
    title: 'Sao v� thanh to�n',
    description:
      'Theo d�i v� sao, l�ch s� c�ng tr�, g�i n�p, quy�n l�i m� kh�a v� c�c giao d�ch c�n �i so�t th� c�ng.',
    metrics: ['1.284 user ho�t �ng', '96 giao d�ch ch� �i so�t', '12 c�nh b�o gian l�n'],
  },
  {
    title: 'Outlet v� booking ops',
    description:
      'Qu�n tr� outlet, nh�n booking ngh� s), �t b�n, soundcheck, nh�c vi�c v� �u ti�n v�n h�nh theo t�ng �a ph��ng.',
    metrics: ['18 outlet active', '31 booking m�i', '9 l�ch soundcheck'],
  },
  {
    title: 'API v� an ninh h� th�ng',
    description:
      'Theo d�i endpoint, webhook, k�t n�i d�ch v� ngo�i, secret server-side v� c�c nguy�n t�c gi�m r�i ro l� quy�n t� frontend.',
    metrics: ['24 endpoint n�i b�', '8 webhook', '0 secret ph�a client'],
  },
]

export const cmsCollections = [
  'users',
  'artistApplications',
  'artistProfiles',
  'artistOwnershipTransfers',
  'agents',
  'outlets',
  'articles',
  'articleBlocks',
  'musicTracks',
  'nonstopMixes',
  'playlists',
  'votes',
  'starWallets',
  'starTopups',
  'bookingRequests',
  'tableReservations',
  'copyrightReports',
  'auditLogs',
]

export const cmsApiGroups = [
  {
    title: 'Content API',
    routes: ['GET /api/articles', 'POST /api/articles', 'PATCH /api/articles/:id/publish'],
  },
  {
    title: 'Artist API',
    routes: ['GET /api/artists', 'POST /api/artists/match', 'PATCH /api/artists/:id/ownership'],
  },
  {
    title: 'Music API',
    routes: ['POST /api/music/upload-signature', 'PATCH /api/music/:id/access', 'POST /api/music/:id/report'],
  },
  {
    title: 'Stars API',
    routes: ['GET /api/stars/wallets', 'POST /api/stars/topups', 'POST /api/stars/manual-adjustments'],
  },
]

export const cmsWorkflowCards = [
  {
    title: 'Duy�t ngh� s) m�i',
    body: 'Ki�m tra h� s� ng k�, �i chi�u social v� link nh�c, sau � quy�t �nh t�o m�i, g�p v�o profile ci ho�c giao v� agent qu�n l�.',
  },
  {
    title: 'Chuy�n quy�n profile',
    body: 'N�u profile do team t�o tr��c �, admin c� th� chuy�n quy�n cho ngh� s) th�t ho�c agent sau khi ho�n t�t x�c minh s� h�u.',
  },
  {
    title: 'Ki�m so�t sao',
    body: 'T�ch r� sao t�ng khi ng k�, sao daily, sao bonus v� sao mua th�m � d� audit, d� x� l� tranh ch�p v� tr�nh th�t tho�t.',
  },
]

export const cmsSiteChannels = [
  {
    title: 'Trang ch�',
    href: '/',
    surfaces: ['Headline slider 5 b�i', '3 b�ng x�p h�ng', 'Nonstop pick', 'Top remix'],
    status: 'ang �ng b�',
  },
  {
    title: 'Tin t�c',
    href: '/tin-tuc',
    surfaces: ['News feed cu�n d�i', 'B�i ghim �u', 'Xem th�m b�i ci'],
    status: 'S�n s�ng map',
  },
  {
    title: 'Ngh� s)',
    href: '/nghe-si',
    surfaces: ['Profile list', 'B� l�c DJ / MC / Rapper / Dancer', 'Vote / Follow / Booking'],
    status: 'C�n k�t n�i CMS',
  },
  {
    title: 'Music',
    href: '/music',
    surfaces: ['Playlist / Track / Remix', 'Hero exclusive slider', 'Media player trung t�m'],
    status: '�u ti�n cao',
  },
  {
    title: '�t b�n',
    href: '/dat-ban',
    surfaces: ['Outlet theo v�ng', 'Vote outlet', 'Form �t b�n'],
    status: 'C�n review d� li�u',
  },
]

export const cmsEditorialCategories = [
  {
    name: 'Tin nightlife',
    owner: 'Editorial',
    rules: ['C� hero ngang', 'Xu�t hi�n � /tin-tuc', 'C� th� ghim l�n slider trang ch�'],
    liveCount: 34,
  },
  {
    name: 'Ph�ng v�n ngh� s)',
    owner: 'Artist Ops',
    rules: ['Ph�i g�n profile ngh� s)', 'C� CTA booking ho�c nghe nh�c', 'C� �nh ch�n dung chu�n'],
    liveCount: 22,
  },
  {
    name: 'Music release',
    owner: 'Music Ops',
    rules: ['C� track ho�c playlist li�n k�t', 'C� quy�n ph�t h�nh r�', 'C� cover v� credit'],
    liveCount: 18,
  },
  {
    name: 'Outlet spotlight',
    owner: 'Venue Ops',
    rules: ['G�n outlet profile', 'C� khu v�c �a ph��ng', 'C� CTA �t b�n'],
    liveCount: 11,
  },
]

export const cmsContentPipeline = [
  { label: 'Nh�p', value: '27', tone: 'muted' },
  { label: 'Ch� media', value: '09', tone: 'accent' },
  { label: 'Ch� duy�t', value: '14', tone: 'accent' },
  { label: '� l�n l�ch', value: '08', tone: 'success' },
]

export const cmsEditorBlocks = [
  {
    title: 'Hero + Typography',
    tools: ['Heading H1-H4', 'Lead paragraph', 'Drop cap', 'Quote card', 'Highlight text'],
  },
  {
    title: 'Media Blocks',
    tools: ['Cover image', 'Gallery 2-4 �nh', 'Portrait strip', 'Before/after visual', 'Caption editor'],
  },
  {
    title: 'Embed + Rich Content',
    tools: ['YouTube', 'Facebook video', 'SoundCloud', 'Spotify / playlist link', 'Shortcode CTA'],
  },
  {
    title: 'Link To Site Surface',
    tools: ['Ghim l�n trang ch�', '�y v�o feed tin t�c', 'G�n profile ngh� s)', 'G�n outlet', 'G�n track / remix'],
  },
]

export const cmsEditorToolbar = ['B', 'I', 'U', 'Aa', 'H2', 'H3', 'Quote', 'Image', 'Gallery', 'Video', 'Embed', 'CTA', 'SEO', 'Preview']

export const cmsEditorialQueue = [
  {
    title: 'Aftermovie headline cho homepage',
    owner: 'Linh / Editor',
    destination: 'Trang ch� + /tin-tuc',
    status: 'Ch� �nh cover',
  },
  {
    title: 'Neon Viper interview',
    owner: 'Artist Ops',
    destination: '/nghe-si/neon-viper + /tin-tuc',
    status: 'Ch� g�n SoundCloud',
  },
  {
    title: 'Water Lily Club Remix release',
    owner: 'Music Ops',
    destination: '/music + Top remix + profile ngh� s)',
    status: 'Ch� duy�t quy�n t�i',
  },
]

export const cmsMediaChecklist = [
  '�nh cover d�c v� ngang �ng theo v� tr� hi�n th� ngo�i site.',
  'Alt text v� credit r� cho t�ng �nh � d� qu�n tr� v� t�t cho SEO.',
  'Link video YouTube ho�c Facebook c� thumbnail �n �nh v� m� ��c.',
  'Embed SoundCloud ho�c player link �y � cho b�i music release.',
  'CTA ch�nh r� r�ng: nghe nh�c, booking, xem profile ho�c �t b�n.',
]

export const cmsPermissionsMatrix = [
  { role: 'Super Admin', access: 'To�n quy�n c�u h�nh API, chuy�n quy�n profile, can thi�p sao, qu�n l� user quy�n cao v� xem audit log.' },
  { role: 'Editor', access: 'T�o, s�a, l�n l�ch, SEO, g�n b�i v�o trang ch� v� feed tin t�c; kh�ng can thi�p sao hay quy�n h� th�ng.' },
  { role: 'Artist Ops', access: 'Duy�t artist signup, match profile, c�p nh�t booking info v� g�n b�i vi�t v�i profile ngh� s).' },
  { role: 'Music Ops', access: 'Qu�n l� track, playlist, remix, premium release, quy�n download v� mapping v�i media player.' },
  { role: 'Finance Ops', access: '�i so�t n�p sao, duy�t payload giao d�ch, ki�m tra v� member v� theo d�i c�nh b�o gian l�n.' },
]

export const cmsAutomationRules = [
  'B�i thu�c Music release ph�i c� �t nh�t m�t li�n k�t track ho�c playlist tr��c khi publish.',
  'B�i thu�c Ph�ng v�n ngh� s) ph�i g�n artist profile v� CTA ch�nh.',
  'Outlet spotlight ph�i g�n outlet, th�nh ph� v� CTA �t b�n.',
  'To�n b� media upload ph�i i qua signed upload c�a backend tr��c khi ghi v�o collection.',
]
