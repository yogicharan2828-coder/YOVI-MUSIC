import { Play, Plus } from "lucide-react";

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-image">
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1800"
          alt="YOVI featured artist"
        />
      </div>

      <div className="hero-gradient" />

      <div className="hero-content">
        <span className="hero-eyebrow">
          YOVI FEATURED
        </span>

        <h1>
          THE SOUND
          <br />
          OF NOW
        </h1>

        <p className="hero-description">
          Discover sounds that move with you.
          <br />
          Your next favorite song is waiting.
        </p>

        <div className="hero-meta">
          <span>2026</span>
          <span className="meta-dot">•</span>
          <span>YOVI ORIGINAL</span>
        </div>

        <div className="hero-actions">
          <button className="hero-play-button">
            <Play size={17} fill="currentColor" />
            <span>PLAY NOW</span>
          </button>

          <button className="hero-add-button">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="hero-index">
        <span>01</span>
        <div className="hero-index-line" />
        <span>04</span>
      </div>
    </section>
  );
}

export default Hero;