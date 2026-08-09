type ServiceItem = {
  title: string;
  bullets: string[];
};

const services: ServiceItem[] = [
  {
    title: "Headhunting Ejecutivo",
    bullets: [
      "Busqueda y seleccion de perfiles ejecutivos y mandos medios.",
      "Proceso personalizado con garantia de reemplazo.",
    ],
  },
  {
    title: "Outsourcing de Atencion al Cliente",
    bullets: [
      "Equipos especializados para empresas tecnologicas.",
      "Formacion continua y supervision dedicada.",
    ],
  },
  {
    title: "Formacion Corporativa",
    bullets: [
      "Programas de soft skills y liderazgo.",
      "Cursos presenciales y en linea adaptados a cada organizacion.",
    ],
  },
];

export default function Services() {
  return (
    <section id="servicios" className="section">
      <div className="container">
        <h2 style={{ fontSize: "2rem", marginTop: 0 }}>Servicios</h2>
        <div className="grid-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="card"
              style={{ padding: "1.25rem" }}
            >
              <h3 style={{ marginTop: 0 }}>{service.title}</h3>
              <ul>
                {service.bullets.map((item) => (
                  <li
                    key={item}
                    style={{ marginBottom: "0.45rem", color: "var(--muted)" }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
