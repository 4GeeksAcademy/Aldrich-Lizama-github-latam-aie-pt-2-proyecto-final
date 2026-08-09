import TalentForm from "@/components/TalentForm";

export default function TalentPage() {
  return (
    <main className="container section" style={{ maxWidth: 820 }}>
      <h1 style={{ marginTop: 0 }}>Formulario de registro de talento</h1>
      <p style={{ color: "var(--muted)" }}>
        Este formulario esta dirigido a profesionales en busqueda activa o
        pasiva de oportunidades laborales.
      </p>
      <p className="card" style={{ padding: "0.8rem", marginBottom: "1rem" }}>
        Eres una empresa buscando talento? Escribenos a contacto@nexova.com
      </p>
      <TalentForm />
    </main>
  );
}
