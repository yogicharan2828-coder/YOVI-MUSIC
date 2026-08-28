import MusicCard from "./MusicCard";

function MusicSection({
  title,
  songs = [],
}) {
  return (
    <section className="music-section">

      <div className="section-header">

        <h2>
          {title}
        </h2>

        <button className="section-see-all">
          SEE ALL
        </button>

      </div>


      <div className="music-carousel">

        {songs.map((song, index) => (

          <MusicCard
            key={`${song.provider ?? "yovi"}-${song.id ?? index}`}
            song={song}
            queue={songs}
          />

        ))}

      </div>

    </section>
  );
}

export default MusicSection;