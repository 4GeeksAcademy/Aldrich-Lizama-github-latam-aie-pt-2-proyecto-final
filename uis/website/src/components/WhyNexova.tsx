const points: string[] = [
  "12 anos de experiencia en el mercado latinoamericano.",
  "Presencia regional: Espana y Estados Unidos.",
  "+500 procesos exitosos de seleccion completados.",
  "Especializacion sectorial en tecnologia, retail y finanzas.",
];

export default function WhyNexova() {
  return (
    <section id="talento" className="section">
      <div className="container">
        <h2 style={{ fontSize: "2rem", marginTop: 0 }}>Por que Nexova</h2>
        <div className="grid-2">
          {points.map((point) => (
            <div
              key={point}
              className="card"
              style={{ padding: "1.25rem", fontWeight: 600 }}
            >
              {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
