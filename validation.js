const form = document.getElementById("application-form");
const globalError = document.getElementById("global-error");
const globalSuccess = document.getElementById("global-success");

const locale = document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "es";

const t = {
  es: {
    fullName: "El nombre debe contener al menos nombre y apellido",
    email: "Ingresa un email válido (ejemplo: nombre@empresa.com)",
    phone: "El teléfono debe incluir código de país (ejemplo: +34 612 345 678)",
    country: "Selecciona tu país de residencia",
    experience: "Los años de experiencia deben estar entre 0 y 50",
    sector: "Selecciona el sector de tu interés",
    englishLevel: "Indica tu nivel de inglés",
    availability: "Selecciona tu disponibilidad",
    linkedin: "Si incluyes LinkedIn, debe ser una URL válida",
    comments: (remaining) => `Los comentarios no pueden exceder 500 caracteres (quedan ${remaining})`,
    terms: "Debes aceptar la política de tratamiento de datos para continuar",
    counter: (remaining) => `${remaining} caracteres restantes`,
    globalError: "Revisa los campos marcados antes de enviar el formulario.",
    successHtml:
      "<p class=\"font-semibold\">¡Gracias por tu interés en Nexova!</p>" +
      "<p class=\"mt-2\">Hemos recibido tu información. Nuestro equipo de selección la revisará y te contactaremos en caso de que tu perfil encaje con alguna de nuestras oportunidades actuales o futuras.</p>" +
      "<p class=\"mt-2\">Mientras tanto, síguenos en LinkedIn para estar al día de nuestras vacantes y contenido sobre desarrollo profesional.</p>",
  },
  en: {
    fullName: "Please enter both first and last name",
    email: "Enter a valid email (example: name@company.com)",
    phone: "Phone must include country code (example: +34 612 345 678)",
    country: "Select your country of residence",
    experience: "Years of experience must be between 0 and 50",
    sector: "Select your sector of interest",
    englishLevel: "Indicate your English level",
    availability: "Select your availability",
    linkedin: "If you include LinkedIn, it must be a valid URL",
    comments: (remaining) => `Comments cannot exceed 500 characters (remaining ${remaining})`,
    terms: "You must accept the data processing policy to continue",
    counter: (remaining) => `${remaining} characters remaining`,
    globalError: "Please review the highlighted fields before submitting.",
    successHtml:
      "<p class=\"font-semibold\">Thank you for your interest in Nexova!</p>" +
      "<p class=\"mt-2\">We have received your information. Our recruitment team will review it and contact you if your profile matches current or future opportunities.</p>" +
      "<p class=\"mt-2\">In the meantime, follow us on LinkedIn to stay up to date with job openings and professional development content.</p>",
  },
}[locale];

function hideGlobalMessages() {
  if (globalError) {
    globalError.textContent = "";
    globalError.classList.add("hidden");
  }
  if (globalSuccess) {
    globalSuccess.textContent = "";
    globalSuccess.classList.add("hidden");
  }
}

function validateFullName(value) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return t.fullName;
  return "";
}

function validateEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) return t.email;
  return "";
}

function validatePhone(value) {
  const phoneRegex = /^\+[0-9]{1,3}\s[0-9\s]{6,20}$/;
  if (!phoneRegex.test(value.trim())) return t.phone;
  return "";
}

function validateCountry(value) {
  if (!value) return t.country;
  return "";
}

function validateExperience(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 50) return t.experience;
  return "";
}

function validateSector(value) {
  if (!value) return t.sector;
  return "";
}

function validateEnglishLevel(value) {
  if (!value) return t.englishLevel;
  return "";
}

function validateAvailability(value) {
  if (!value) return t.availability;
  return "";
}

function validateLinkedin(value) {
  if (!value.trim()) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return t.linkedin;
    }
    return "";
  } catch {
    return t.linkedin;
  }
}

function validateComments(value) {
  const remaining = 500 - value.length;
  if (remaining < 0) return t.comments(remaining);
  return "";
}

function validateTerms(checked) {
  if (!checked) return t.terms;
  return "";
}

function showFieldError(fieldName, message) {
  const errorEl = document.getElementById(`error-${fieldName}`);
  if (!errorEl) return;

  if (message) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  } else {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
}

function setInputInvalidState(inputEl, hasError) {
  if (!inputEl) return;
  if (hasError) {
    inputEl.setAttribute("aria-invalid", "true");
    inputEl.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-200");
  } else {
    inputEl.removeAttribute("aria-invalid");
    inputEl.classList.remove("border-red-500", "focus:border-red-500", "focus:ring-red-200");
  }
}

function setRadioGroupInvalidState(name, hasError) {
  const radios = document.querySelectorAll(`input[name="${name}"]`);
  radios.forEach((radio) => {
    setInputInvalidState(radio, hasError);
  });
}

function updateCommentsCounter() {
  const comments = document.getElementById("comments");
  const counter = document.getElementById("comments-counter");
  if (!comments || !counter) return;
  const remaining = 500 - comments.value.length;
  counter.textContent = t.counter(remaining);
}

function validateForm() {
  const data = new FormData(form);
  const availabilityValue = data.get("availability") || "";
  const termsField = document.getElementById("terms");

  const errors = {
    fullName: validateFullName(String(data.get("fullName") || "")),
    email: validateEmail(String(data.get("email") || "")),
    phone: validatePhone(String(data.get("phone") || "")),
    country: validateCountry(String(data.get("country") || "")),
    experience: validateExperience(String(data.get("experience") || "")),
    sector: validateSector(String(data.get("sector") || "")),
    englishLevel: validateEnglishLevel(String(data.get("englishLevel") || "")),
    availability: validateAvailability(String(availabilityValue)),
    linkedin: validateLinkedin(String(data.get("linkedin") || "")),
    comments: validateComments(String(data.get("comments") || "")),
    terms: validateTerms(Boolean(termsField && termsField.checked)),
  };

  showFieldError("fullName", errors.fullName);
  showFieldError("email", errors.email);
  showFieldError("phone", errors.phone);
  showFieldError("country", errors.country);
  showFieldError("experience", errors.experience);
  showFieldError("sector", errors.sector);
  showFieldError("englishLevel", errors.englishLevel);
  showFieldError("availability", errors.availability);
  showFieldError("linkedin", errors.linkedin);
  showFieldError("comments", errors.comments);
  showFieldError("terms", errors.terms);

  setInputInvalidState(document.getElementById("fullName"), Boolean(errors.fullName));
  setInputInvalidState(document.getElementById("email"), Boolean(errors.email));
  setInputInvalidState(document.getElementById("phone"), Boolean(errors.phone));
  setInputInvalidState(document.getElementById("country"), Boolean(errors.country));
  setInputInvalidState(document.getElementById("experience"), Boolean(errors.experience));
  setInputInvalidState(document.getElementById("sector"), Boolean(errors.sector));
  setInputInvalidState(document.getElementById("englishLevel"), Boolean(errors.englishLevel));
  setRadioGroupInvalidState("availability", Boolean(errors.availability));
  setInputInvalidState(document.getElementById("linkedin"), Boolean(errors.linkedin));
  setInputInvalidState(document.getElementById("comments"), Boolean(errors.comments));
  setInputInvalidState(document.getElementById("terms"), Boolean(errors.terms));

  const firstErrorKey = Object.keys(errors).find((key) => errors[key]);
  return { isValid: !firstErrorKey, firstErrorKey };
}

if (form) {
  updateCommentsCounter();

  const fieldValidators = {
    fullName: validateFullName,
    email: validateEmail,
    phone: validatePhone,
    country: validateCountry,
    experience: validateExperience,
    sector: validateSector,
    englishLevel: validateEnglishLevel,
    linkedin: validateLinkedin,
    comments: validateComments,
  };

  Object.entries(fieldValidators).forEach(([fieldId, validator]) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const eventType = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventType, () => {
      hideGlobalMessages();
      const message = validator(field.value);
      showFieldError(fieldId, message);
      setInputInvalidState(field, Boolean(message));
      if (fieldId === "comments") updateCommentsCounter();
    });
  });

  const radios = document.querySelectorAll('input[name="availability"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      hideGlobalMessages();
      const selected = document.querySelector('input[name="availability"]:checked');
      const message = validateAvailability(selected ? selected.value : "");
      showFieldError("availability", message);
      setRadioGroupInvalidState("availability", Boolean(message));
    });
  });

  const termsField = document.getElementById("terms");
  if (termsField) {
    termsField.addEventListener("change", () => {
      hideGlobalMessages();
      const message = validateTerms(termsField.checked);
      showFieldError("terms", message);
      setInputInvalidState(termsField, Boolean(message));
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideGlobalMessages();

    const { isValid, firstErrorKey } = validateForm();

    if (!isValid) {
      if (globalError) {
        globalError.textContent = t.globalError;
        globalError.classList.remove("hidden");
      }

      if (firstErrorKey === "availability") {
        const firstRadio = document.querySelector('input[name="availability"]');
        if (firstRadio) firstRadio.focus();
      } else {
        const firstField = document.getElementById(firstErrorKey);
        if (firstField) firstField.focus();
      }
      return;
    }

    form.reset();
    updateCommentsCounter();

    [
      "fullName",
      "email",
      "phone",
      "country",
      "experience",
      "sector",
      "englishLevel",
      "availability",
      "linkedin",
      "comments",
      "terms",
    ].forEach((field) => showFieldError(field, ""));

    [
      "fullName",
      "email",
      "phone",
      "country",
      "experience",
      "sector",
      "englishLevel",
      "linkedin",
      "comments",
      "terms",
    ].forEach((fieldId) => setInputInvalidState(document.getElementById(fieldId), false));

    setRadioGroupInvalidState("availability", false);

    if (globalSuccess) {
      globalSuccess.innerHTML = t.successHtml;
      globalSuccess.classList.remove("hidden");
    }
  });
}
