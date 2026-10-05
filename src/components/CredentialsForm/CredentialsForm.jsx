import { useState } from "react";
import "./CredentialsForm.css";

export function CredentialsForm({ onSubmit }) {
  const [values, setValues] = useState({
    idInstance: "",
    apiTokenInstance: "",
  });

  const update = (key) => (event) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <section className="auth-card">
      <p className="eyebrow">Green API · MAX</p>
      <h1>Войдите в рабочий чат</h1>

      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="instance">
          ID инстанса
        </label>
        <input
          id="instance"
          required
          value={values.idInstance}
          onChange={update("idInstance")}
          placeholder="idInstance"
        />

        <label className="field-label" htmlFor="token">
          Токен инстанса
        </label>
        <input
          id="token"
          required
          type="password"
          value={values.apiTokenInstance}
          onChange={update("apiTokenInstance")}
          placeholder="apiTokenInstance"
        />

        <button className="primary-button" type="submit">
          Открыть чат
        </button>
      </form>

    </section>
  );
}
