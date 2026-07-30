"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateEstablishment,
  updateProfile,
} from "../app/app/configuracoes/actions";

const initialState = { error: "", success: "" };

function Submit({ label }) {
  const { pending } = useFormStatus();
  return (
    <button className="button button--primary settings-submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={16} /> Salvando</> : <><Save size={16} /> {label}</>}
    </button>
  );
}

function Feedback({ state }) {
  if (state.error) return <p className="form-message form-message--error" role="alert">{state.error}</p>;
  if (state.success) return <p className="form-message form-message--success" role="status"><CheckCircle2 size={16} />{state.success}</p>;
  return null;
}

export function EstablishmentSettingsForm({ establishment }) {
  const [state, action] = useActionState(updateEstablishment, initialState);
  return (
    <form className="settings-form" action={action}>
      <div className="settings-section-heading">
        <div><h2>Dados do estabelecimento</h2><p>Essas informações identificam o negócio no painel e na página pública.</p></div>
      </div>

      <div className="field-grid settings-grid">
        <div className="field"><label htmlFor="settingsName">Nome</label><input id="settingsName" name="name" defaultValue={establishment.name || ""} required /></div>
        <div className="field"><label htmlFor="settingsCategory">Categoria</label><select id="settingsCategory" name="category" defaultValue={establishment.category || "other"}><option value="barbershop">Barbearia</option><option value="salon">Salão de beleza</option><option value="nail_studio">Esmalteria / manicure</option><option value="beauty_studio">Estúdio de beleza</option><option value="other">Outro</option></select></div>
        <div className="field"><label htmlFor="settingsPhone">WhatsApp do negócio</label><input id="settingsPhone" name="phone" type="tel" defaultValue={establishment.phone || ""} required /></div>
        <div className="field"><label htmlFor="settingsEmail">E-mail comercial <span>opcional</span></label><input id="settingsEmail" name="email" type="email" defaultValue={establishment.email || ""} /></div>
      </div>

      <div className="settings-divider" />
      <div className="settings-section-heading"><div><h2>Endereço público</h2><p>Complete apenas os campos que deseja mostrar aos clientes.</p></div></div>
      <div className="field-grid settings-grid">
        <div className="field settings-span-2"><label htmlFor="settingsAddress">Rua ou avenida</label><input id="settingsAddress" name="addressLine" defaultValue={establishment.address_line || ""} /></div>
        <div className="field"><label htmlFor="settingsNumber">Número</label><input id="settingsNumber" name="addressNumber" defaultValue={establishment.address_number || ""} /></div>
        <div className="field"><label htmlFor="settingsComplement">Complemento</label><input id="settingsComplement" name="addressComplement" defaultValue={establishment.address_complement || ""} /></div>
        <div className="field"><label htmlFor="settingsNeighborhood">Bairro</label><input id="settingsNeighborhood" name="neighborhood" defaultValue={establishment.neighborhood || ""} /></div>
        <div className="field"><label htmlFor="settingsCity">Cidade</label><input id="settingsCity" name="city" defaultValue={establishment.city || ""} /></div>
        <div className="field"><label htmlFor="settingsState">UF</label><input id="settingsState" name="state" maxLength={2} defaultValue={establishment.state || ""} /></div>
        <div className="field"><label htmlFor="settingsPostal">CEP</label><input id="settingsPostal" name="postalCode" inputMode="numeric" defaultValue={establishment.postal_code || ""} /></div>
      </div>
      <Feedback state={state} />
      <Submit label="Salvar estabelecimento" />
    </form>
  );
}

export function ProfileSettingsForm({ profile, email }) {
  const [state, action] = useActionState(updateProfile, initialState);
  return (
    <form className="settings-form settings-form--compact" action={action}>
      <div className="settings-profile-mark"><UserRound size={19} /></div>
      <div className="settings-section-heading"><div><h2>Seu perfil</h2><p>Informações usadas para identificar seu acesso dentro do Marc.</p></div></div>
      <div className="field"><label htmlFor="settingsFullName">Nome completo</label><input id="settingsFullName" name="fullName" defaultValue={profile?.full_name || ""} required /></div>
      <div className="field"><label htmlFor="settingsProfilePhone">Seu WhatsApp <span>opcional</span></label><input id="settingsProfilePhone" name="profilePhone" type="tel" defaultValue={profile?.phone || ""} /></div>
      <div className="field"><label htmlFor="settingsAccountEmail">E-mail de acesso</label><input id="settingsAccountEmail" value={email || ""} readOnly aria-describedby="account-email-help" /><small id="account-email-help" className="field-help">A alteração de e-mail exigirá reconfirmação e será adicionada em uma próxima etapa.</small></div>
      <Feedback state={state} />
      <Submit label="Salvar perfil" />
    </form>
  );
}
