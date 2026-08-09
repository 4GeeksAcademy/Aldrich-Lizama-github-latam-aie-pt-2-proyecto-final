"use client";

import { FormEvent, useMemo, useState } from "react";

type FormDataShape = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  yearsOfExperience: string;
  sector: string;
  englishLevel: string;
  availability: string;
  linkedin: string;
  comments: string;
  termsAccepted: boolean;
};

type FormErrors = Partial<Record<keyof FormDataShape, string>>;

const initialForm: FormDataShape = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  yearsOfExperience: "",
  sector: "",
  englishLevel: "",
  availability: "",
  linkedin: "",
  comments: "",
  termsAccepted: false,
};

function validate(data: FormDataShape): FormErrors {
  const errors: FormErrors = {};

  if (data.fullName.trim().split(/\s+/).length < 2) {
    errors.fullName = "El nombre debe contener al menos nombre y apellido";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Ingresa un email valido (ejemplo: nombre@empresa.com)";
  }

  if (!/^\+[0-9]{1,3}\s[0-9\s]{6,20}$/.test(data.phone.trim())) {
    errors.phone =
      "El telefono debe incluir codigo de pais (ejemplo: +34 612 345 678)";
  }

  if (!data.country) errors.country = "Selecciona tu pais de residencia";

  const years = Number(data.yearsOfExperience);
  if (!Number.isFinite(years) || years < 0 || years > 50) {
    errors.yearsOfExperience =
      "Los anos de experiencia deben estar entre 0 y 50";
  }

  if (!data.sector) errors.sector = "Selecciona el sector de tu interes";
  if (!data.englishLevel) errors.englishLevel = "Indica tu nivel de ingles";
  if (!data.availability) errors.availability = "Selecciona tu disponibilidad";

  if (data.linkedin.trim() && !/^https?:\/\//.test(data.linkedin.trim())) {
    errors.linkedin = "Si incluyes LinkedIn, debe ser una URL valida";
  }

  if (data.comments.length > 500) {
    errors.comments = "Los comentarios no pueden exceder 500 caracteres";
  }

  if (!data.termsAccepted) {
    errors.termsAccepted =
      "Debes aceptar la politica de tratamiento de datos para continuar";
  }

  return errors;
}

export default function TalentForm() {
  const [formData, setFormData] = useState<FormDataShape>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const remainingComments = useMemo(
    () => 500 - formData.comments.length,
    [formData.comments.length],
  );

  const setField = <K extends keyof FormDataShape>(
    key: K,
    value: FormDataShape[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(formData);
    setErrors(validation);

    if (Object.keys(validation).length === 0) {
      setSubmitted(true);
      setFormData(initialForm);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="card"
      style={{ padding: "1rem", display: "grid", gap: "0.9rem" }}
    >
      <div>
        <label htmlFor="fullName">Nombre completo *</label>
        <input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          style={{ width: "100%" }}
        />
        {errors.fullName ? (
          <p style={{ color: "crimson" }}>{errors.fullName}</p>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div>
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            value={formData.email}
            onChange={(e) => setField("email", e.target.value)}
            style={{ width: "100%" }}
          />
          {errors.email ? (
            <p style={{ color: "crimson" }}>{errors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="phone">Telefono *</label>
          <input
            id="phone"
            value={formData.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+34 612 345 678"
            style={{ width: "100%" }}
          />
          {errors.phone ? (
            <p style={{ color: "crimson" }}>{errors.phone}</p>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div>
          <label htmlFor="country">Pais de residencia *</label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) => setField("country", e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Selecciona una opcion</option>
            <option value="es">Espana</option>
            <option value="us">Estados Unidos</option>
            <option value="other">Otro</option>
          </select>
          {errors.country ? (
            <p style={{ color: "crimson" }}>{errors.country}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="yearsOfExperience">Anos de experiencia *</label>
          <input
            id="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={(e) => setField("yearsOfExperience", e.target.value)}
            style={{ width: "100%" }}
          />
          {errors.yearsOfExperience ? (
            <p style={{ color: "crimson" }}>{errors.yearsOfExperience}</p>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div>
          <label htmlFor="sector">Sector de interes *</label>
          <select
            id="sector"
            value={formData.sector}
            onChange={(e) => setField("sector", e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Selecciona una opcion</option>
            <option value="tech">Tecnologia</option>
            <option value="retail">Retail</option>
            <option value="finance">Servicios Financieros</option>
            <option value="consulting">Consultoria</option>
            <option value="other">Otro</option>
          </select>
          {errors.sector ? (
            <p style={{ color: "crimson" }}>{errors.sector}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="englishLevel">Nivel de ingles *</label>
          <select
            id="englishLevel"
            value={formData.englishLevel}
            onChange={(e) => setField("englishLevel", e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Selecciona una opcion</option>
            <option value="basic">Basico</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
            <option value="native">Nativo</option>
          </select>
          {errors.englishLevel ? (
            <p style={{ color: "crimson" }}>{errors.englishLevel}</p>
          ) : null}
        </div>
      </div>

      <div>
        <span>Disponibilidad *</span>
        <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.4rem" }}>
          {[
            ["immediate", "Inmediata"],
            ["1-month", "1 mes"],
            ["2-3-months", "2-3 meses"],
            ["exploring", "Solo explorando"],
          ].map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="availability"
                checked={formData.availability === value}
                onChange={() => setField("availability", value)}
              />{" "}
              {label}
            </label>
          ))}
        </div>
        {errors.availability ? (
          <p style={{ color: "crimson" }}>{errors.availability}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="linkedin">LinkedIn (URL del perfil)</label>
        <input
          id="linkedin"
          value={formData.linkedin}
          onChange={(e) => setField("linkedin", e.target.value)}
          placeholder="https://linkedin.com/in/tu-perfil"
          style={{ width: "100%" }}
        />
        {errors.linkedin ? (
          <p style={{ color: "crimson" }}>{errors.linkedin}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="comments">Comentarios adicionales</label>
        <textarea
          id="comments"
          value={formData.comments}
          onChange={(e) => setField("comments", e.target.value)}
          style={{ width: "100%" }}
        />
        <p style={{ color: "var(--muted)", margin: "0.4rem 0" }}>
          {remainingComments} caracteres restantes
        </p>
        {errors.comments ? (
          <p style={{ color: "crimson" }}>{errors.comments}</p>
        ) : null}
      </div>

      <label>
        <input
          type="checkbox"
          checked={formData.termsAccepted}
          onChange={(e) => setField("termsAccepted", e.target.checked)}
        />{" "}
        Acepto politica de tratamiento de datos *
      </label>
      {errors.termsAccepted ? (
        <p style={{ color: "crimson" }}>{errors.termsAccepted}</p>
      ) : null}

      <button type="submit" className="btn btn-primary">
        Enviar registro
      </button>

      {submitted ? (
        <div
          className="card"
          style={{ padding: "0.9rem", borderColor: "#2d8a52" }}
        >
          <strong>Gracias por tu interes en Nexova.</strong>
          <p style={{ marginBottom: 0 }}>
            Hemos recibido tu informacion. Nuestro equipo de seleccion revisara
            tu perfil y te contactara si encaja con oportunidades actuales o
            futuras.
          </p>
        </div>
      ) : null}
    </form>
  );
}
