import { useEffect, useMemo, useState } from 'react'
import paintingData from '../Painting_info - Data.csv?raw'
import heroPainting from '../paintings/Cai002.jpeg'
import './App.css'

const baseUrl = import.meta.env.BASE_URL

const paintingImages = import.meta.glob('../paintings/*.jpeg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const imageByFilename = Object.fromEntries(
  Object.entries(paintingImages).map(([path, url]) => [
    path.split('/').pop().replace('.jpeg', ''),
    url,
  ]),
)

const paintings = paintingData
  .trim()
  .split(/\r?\n/)
  .slice(2)
  .map((row) => {
    const [
      filename,
      title,
      year,
      medium,
      size,
      ,
      ,
      ,
      price,
      available,
      pleinAir,
      studio,
      alberta,
      ontario,
      stillLife,
      portrait,
    ] = row.split(',')

    return {
      filename,
      title,
      year,
      medium,
      size,
      price,
      available: available === 'TRUE',
      image: imageByFilename[filename],
      tags: [
        pleinAir === 'TRUE' && 'Plein air',
        studio === 'TRUE' && 'Studio work',
        alberta === 'TRUE' && 'Alberta',
        ontario === 'TRUE' && 'Ontario',
        stillLife === 'TRUE' && 'Still life',
        portrait === 'TRUE' && 'Portraits & figures',
      ].filter(Boolean),
      isLandscape: stillLife !== 'TRUE' && portrait !== 'TRUE',
    }
  })

const filters = [
  { label: 'All', test: () => true },
  { label: 'Landscape', test: (painting) => painting.isLandscape },
  { label: 'Plein air', test: (painting) => painting.tags.includes('Plein air') },
  { label: 'Studio work', test: (painting) => painting.tags.includes('Studio work') },
  { label: 'Still life', test: (painting) => painting.tags.includes('Still life') },
  { label: 'Figures', test: (painting) => painting.tags.includes('Portraits & figures') },
]

function Home() {
  const navigation = [
    { label: 'works', href: `${baseUrl}works` },
    { label: 'about', href: `${baseUrl}about` },
    { label: 'contact', href: `${baseUrl}contact` },
  ]

  return (
    <main className="home">
      <img
        className="home__painting"
        src={heroPainting}
        alt="Snow-covered rocks and wind-shaped evergreens beneath a pale winter sky"
      />
      <div className="home__shade" aria-hidden="true" />
      <div className="home__content">
        <h1 className="home__title">Joanne Cai</h1>
        <nav className="home__nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
      </div>
    </main>
  )
}

function PaintingModal({ painting, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('modal-open')
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="painting-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="painting-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="painting-modal__close" type="button" onClick={onClose} aria-label="Close details">
          <span aria-hidden="true">×</span>
        </button>
        <h2 id="painting-title">{painting.title}</h2>
        <div className="painting-modal__body">
          <img src={painting.image} alt={painting.title} />
          <div className="painting-modal__info">
            <p>{painting.year}</p>
            <p>{painting.medium}</p>
            <p>{painting.size} inches</p>
            <p className="painting-modal__availability">
              {painting.available ? `Available · $${Number(painting.price).toLocaleString('en-CA')} CAD` : 'Not available'}
            </p>
          </div>
        </div>
        <div className="painting-modal__tags" aria-label="Artwork tags">
          {painting.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </section>
    </div>
  )
}

function Works() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedPainting, setSelectedPainting] = useState(null)
  const visiblePaintings = useMemo(() => {
    const filter = filters.find((item) => item.label === activeFilter)
    return paintings.filter(filter.test)
  }, [activeFilter])

  return (
    <main className="works-page">
      <header className="works-header">
        <a className="works-header__artist" href={baseUrl}>Joanne Cai</a>
        <h1>Works</h1>
        <p className="works-header__intro">Selected paintings</p>
        <div className="filters" aria-label="Filter artworks">
          <span className="filters__label">Filter by</span>
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={activeFilter === filter.label ? 'is-active' : ''}
              aria-pressed={activeFilter === filter.label}
              onClick={() => setActiveFilter(filter.label)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <section className="works-grid" aria-live="polite">
        {visiblePaintings.map((painting) => (
          <button
            className="work-card"
            type="button"
            key={painting.filename}
            onClick={() => setSelectedPainting(painting)}
            aria-label={`View ${painting.title}`}
          >
            <img src={painting.image} alt="" loading="lazy" />
            <span>{painting.title}</span>
          </button>
        ))}
      </section>

      {selectedPainting && (
        <PaintingModal painting={selectedPainting} onClose={() => setSelectedPainting(null)} />
      )}
    </main>
  )
}

function App() {
  const basePath = new URL(baseUrl, window.location.origin).pathname
  const route = window.location.pathname
    .slice(basePath.length)
    .replace(/^\/+|\/+$/g, '')

  return route === 'works' ? <Works /> : <Home />
}

export default App
