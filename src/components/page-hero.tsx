export function PageHero({
  eyebrow,
  title,
  intro
}: {
  eyebrow: string
  title: string
  intro: string
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="kicker">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-intro">{intro}</p>
      </div>
    </section>
  )
}
