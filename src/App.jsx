import { useEffect, useMemo, useState } from 'react'
import paintingData from '../Painting_info - Data.csv?raw'
import heroPainting from '../paintings/Cai002.jpeg'
import './App.css'

const baseUrl = import.meta.env.BASE_URL
const getRoute = () => window.location.hash.replace(/^#\/?|\/+$/g, '')

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

function SiteNav({ activePage }) {
  const links = [
    { label: 'Works', href: `${baseUrl}#/works`, page: 'works' },
    { label: 'About', href: `${baseUrl}#/about`, page: 'about' },
    { label: 'Contact', href: `${baseUrl}#/contact`, page: 'contact' },
  ]

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <a className="site-nav__artist" href={baseUrl}>Joanne Cai</a>
      <div className="site-nav__links">
        {links.map((link) => (
          <a
            key={link.page}
            href={link.href}
            className={activePage === link.page ? 'is-active' : ''}
            aria-current={activePage === link.page ? 'page' : undefined}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

function Home() {
  const navigation = [
    { label: 'works', href: `${baseUrl}#/works` },
    { label: 'about', href: `${baseUrl}#/about` },
    { label: 'contact', href: `${baseUrl}#/contact` },
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
  const displayTags = [painting.isLandscape && 'Landscape', ...painting.tags].filter(Boolean)
  const formattedPrice = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(painting.price))

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
        <header className="painting-modal__header">
          <h2 id="painting-title">{painting.title}</h2>
        </header>
        <div className="painting-modal__body">
          <img src={painting.image} alt={painting.title} />
          <aside className="painting-modal__info" aria-label="Painting information">
            <h3>Artwork details</h3>
            <dl>
              <div>
                <dt>Year</dt>
                <dd>{painting.year}</dd>
              </div>
              <div>
                <dt>Medium</dt>
                <dd>{painting.medium}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd>{painting.size} in</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd className={`detail-status ${painting.available ? 'is-available' : 'is-unavailable'}`}>
                  <span aria-hidden="true" />
                  {painting.available ? 'Available' : 'Not available'}
                </dd>
              </div>
              {painting.available && (
                <div>
                  <dt>Price</dt>
                  <dd>{formattedPrice} CAD</dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
        <footer className="painting-modal__footer">
          <p>Categories</p>
          <div className="painting-modal__tags" aria-label="Artwork categories">
            {displayTags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </footer>
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
      <SiteNav activePage="works" />
      <header className="works-header">
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

function BlankPage({ page, title }) {
  return (
    <main className="blank-page">
      <SiteNav activePage={page} />
      <section className="blank-page__content" aria-labelledby={`${page}-title`}>
        <h1 id={`${page}-title`}>{title}</h1>
      </section>
    </main>
  )
}

function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handleRouteChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleRouteChange)
    return () => window.removeEventListener('hashchange', handleRouteChange)
  }, [])

  if (route === 'works') return <Works />
  if (route === 'about') return <BlankPage page="about" title="About" />
  if (route === 'contact') return <BlankPage page="contact" title="Contact" />
  return <Home />
}

export default App
