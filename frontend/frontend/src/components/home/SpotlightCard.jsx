function SpotlightCard({ item }) {
  return (
    <article className="spotlight-card">
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
      />

      <div className="spotlight-gradient" />

      <div className="spotlight-content">
        <span>{item.label}</span>

        <h3>{item.title}</h3>

        <p>{item.description}</p>
      </div>
    </article>
  );
}

export default SpotlightCard;