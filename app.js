'use strict';

const FIELDS = ['name', 'email', 'phone', 'pass', 'role'];

const validState = { name: false, email: false, phone: false, pass: false, role: false };

const STRENGTH_CONFIG = {
  colors: ['#E24B4A', '#EF9F27', '#1D9E75', '#0F6E56'],
  labels: ['Muy débil', 'Débil', 'Buena', 'Fuerte'],
};

function validate(key) {
  const input = document.getElementById(`inp-${key}`);
  const value = key === 'pass' ? input.value : input.value.trim();
  const error = getError(key, value);

  setState(key, !error, error);
  return !error;
}

function getError(key, value) {
  switch (key) {
    case 'name':
      if (!value)            return 'El nombre no puede estar vacío';
      if (value.length < 3)  return 'Mínimo 3 caracteres';
      if (!/^[\p{L}\s'\-]+$/u.test(value)) return 'Solo se permiten letras';
      return null;

    case 'email':
      if (!value)            return 'El correo no puede estar vacío';
      if (/\s/.test(value))  return 'Sin espacios';
      const [local, domain, ...rest] = value.split('@');
      if (rest.length || !local || !domain) return 'Debe tener exactamente un @';
      if (!domain.includes('.'))            return 'Dominio inválido. Ej: correo.com';
      if (domain.split('.').at(-1).length < 2) return 'Extensión muy corta';
      return null;

    case 'phone':
      if (!value) return 'El teléfono no puede estar vacío';
      const digits = value.replace(/[\s\-().]/g, '').replace(/^\+/, '');
      if (!/^\d+$/.test(digits)) return 'Solo dígitos y el símbolo +';
      if (digits.length < 7)     return 'Mínimo 7 dígitos';
      if (digits.length > 15)    return 'Máximo 15 dígitos';
      return null;

    case 'pass':
      if (!value)           return 'La contraseña no puede estar vacía';
      if (/\s/.test(value)) return 'Sin espacios';
      if (value.length < 8) return 'Mínimo 8 caracteres';
      if (!/[A-Za-z]/.test(value)) return 'Debe incluir letras';
      if (!/[0-9]/.test(value))    return 'Debe incluir números';
      return null;

    case 'role':
      if (!value) return 'Selecciona un rol';
      return null;

    default:
      return null;
  }
}

function setState(key, isValid, message) {
  const field = document.getElementById(`field-${key}`);
  const err   = document.getElementById(`err-${key}`);

  field.classList.toggle('valid', isValid);
  field.classList.toggle('error', !isValid);
  err.textContent = isValid ? '' : message;

  validState[key] = isValid;
  updateProgress();
}

function updateProgress() {
  const done  = Object.values(validState).filter(Boolean).length;
  const total = FIELDS.length;

  document.getElementById('progress-fill').style.width = `${Math.round((done / total) * 100)}%`;
  document.getElementById('progress-label').textContent = `${done} de ${total} campos completados`;
}

function calcStrength(value) {
  return [
    value.length >= 8,
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
}

function updateStrength(value) {
  const wrap  = document.getElementById('strength');
  const label = document.getElementById('strength-label');
  const bars  = [0, 1, 2, 3].map(i => document.getElementById(`bar${i}`));

  if (!value.length) {
    wrap.classList.remove('show');
    return;
  }

  wrap.classList.add('show');

  const score = calcStrength(value);
  const color = STRENGTH_CONFIG.colors[score - 1] ?? 'var(--border)';

  bars.forEach((bar, i) => { bar.style.background = i < score ? color : ''; });
  label.textContent  = STRENGTH_CONFIG.labels[score - 1] ?? '';
  label.style.color  = color;
}

function shake(key) {
  const field = document.getElementById(`field-${key}`);
  field.classList.remove('shake');
  void field.offsetWidth;
  field.classList.add('shake');
  field.addEventListener('animationend', () => field.classList.remove('shake'), { once: true });
}

function resetForm() {
  document.getElementById('form').reset();
  FIELDS.forEach(key => {
    document.getElementById(`field-${key}`).classList.remove('valid', 'error');
    document.getElementById(`err-${key}`).textContent = '';
    validState[key] = false;
  });
  document.getElementById('strength').classList.remove('show');
  updateProgress();
}

function bindEvents() {
  ['name', 'email', 'phone'].forEach(key => {
    const el = document.getElementById(`inp-${key}`);
    el.addEventListener('input', () => validate(key));
    el.addEventListener('blur',  () => validate(key));
  });

  const passInput = document.getElementById('inp-pass');
  passInput.addEventListener('input', () => {
    updateStrength(passInput.value);
    validate('pass');
  });
  passInput.addEventListener('blur', () => validate('pass'));

  document.getElementById('inp-role').addEventListener('change', () => validate('role'));

  document.getElementById('toggle-pass').addEventListener('click', () => {
    const show     = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';

    document.getElementById('eye-icon').innerHTML = show
      ? `<path d="M3 3l14 14M10.5 5.07A7.8 7.8 0 0110 5c-5.5 0-9 5-9 5a16.6 16.6 0 003.06 3.44M7.5 7.5a3 3 0 004 4M12.46 12.46A3 3 0 0110 13a3 3 0 01-3-3c0-.55.15-1.06.41-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
      : `<path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" stroke="currentColor" stroke-width="1.5"/>
         <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>`;

    document.getElementById('toggle-pass').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  document.getElementById('form').addEventListener('submit', e => {
    e.preventDefault();

    const results = Object.fromEntries(FIELDS.map(k => [k, validate(k)]));
    const allOk   = Object.values(results).every(Boolean);

    if (!allOk) {
      const first = FIELDS.find(k => !results[k]);
      FIELDS.filter(k => !results[k]).forEach(shake);
      if (first) document.getElementById(`inp-${first}`).focus();
      return;
    }

    document.getElementById('success').classList.add('show');
    setTimeout(() => {
      resetForm();
      document.getElementById('success').classList.remove('show');
    }, 2500);
  });
}

updateProgress();
bindEvents();
