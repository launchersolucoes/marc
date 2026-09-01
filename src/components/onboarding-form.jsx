"use client";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createEstablishment } from "../app/onboarding/actions";
import { currentLegalDocuments } from "../lib/legal-documents";

const initialState = { error: "" };

function FinishButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button button--primary onboarding-submit" type="submit" disabled={pending}>
      {pending ? (
        <><LoaderCircle className="spin" size={18} /> Criando espaço</>
      ) : (
        <>Abrir meu painel <ArrowRight size={18} /></>
      )}
    </button>
  );
}

export default function OnboardingForm({ defaultName = "" }) {
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState(createEstablishment, initialState);
  const formRef = useRef(null);

  function continueToAddress() {
    if (formRef.current?.reportValidity()) setStep(2);
  }

  return (
    <form ref={formRef} className="onboarding-form" action={formAction}>
      <div className="onboarding-progress" aria-label={`Etapa ${step} de 2`}>
        <span className={step >= 1 ? "is-active" : ""} />
        <span className={step >= 2 ? "is-active" : ""} />
      </div>

      <fieldset hidden={step !== 1}>
        <div className="onboarding-step-heading">
          <div><BriefcaseBusiness size={22} /></div>
          <span>Etapa 1 de 2</span>
          <h1>Conte o essencial sobre seu negócio.</h1>
          <p>É o suficiente para criar sua agenda. Os detalhes podem ser ajustados depois.</p>
        </div>

        <div className="field">
          <label htmlFor="businessName">Nome do estabelecimento</label>
          <input
            id="businessName"
            name="businessName"
            defaultValue={defaultName}
            autoComplete="organization"
            placeholder="Ex.: Barbearia Central"
            minLength={2}
            maxLength={100}
            required
          />
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="category">Categoria</label>
            <select id="category" name="category" defaultValue="" required>
              <option value="" disabled>Escolha uma opção</option>
              <option value="barbershop">Barbearia</option>
              <option value="salon">Salão de beleza</option>
              <option value="nail_studio">Esmalteria / manicure</option>
              <option value="beauty_studio">Estúdio de beleza</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="phone">WhatsApp do negócio</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              minLength={8}
              maxLength={24}
              required
            />
          </div>
        </div>

        <label className="choice-row">
          <input type="checkbox" name="worksHere" defaultChecked />
          <span className="choice-row__check"><Check size={15} /></span>
          <span>
            <strong>Eu também atendo clientes</strong>
            <small>Criaremos seu perfil profissional junto com o estabelecimento.</small>
          </span>
        </label>

        <button className="button button--primary onboarding-next" type="button" onClick={continueToAddress}>
          Continuar <ArrowRight size={18} />
        </button>
      </fieldset>

      <fieldset hidden={step !== 2}>
        <div className="onboarding-step-heading">
          <div><MapPin size={22} /></div>
          <span>Etapa 2 de 2</span>
          <h1>Onde seus clientes encontram você?</h1>
          <p>O endereço prepara sua página pública. Você também pode completar isso depois.</p>
        </div>

        <div className="field">
          <label htmlFor="address">Endereço <span>opcional</span></label>
          <input
            id="address"
            name="address"
            autoComplete="street-address"
            placeholder="Rua, avenida e número"
            maxLength={140}
          />
        </div>

        <div className="field-grid field-grid--location">
          <div className="field">
            <label htmlFor="city">Cidade <span>opcional</span></label>
            <input id="city" name="city" autoComplete="address-level2" placeholder="Sua cidade" maxLength={80} />
          </div>
          <div className="field field--state">
            <label htmlFor="state">UF</label>
            <input id="state" name="state" autoComplete="address-level1" placeholder="SP" maxLength={2} />
          </div>
        </div>

        {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}

        <label className="choice-row choice-row--legal">
          <input type="checkbox" name="legalAcceptance" required />
          <span className="choice-row__check"><Check size={15} /></span>
          <span>
            <strong>Li e concordo com os documentos vigentes</strong>
            <small>
              <a href={currentLegalDocuments.terms.href} target="_blank" rel="noreferrer">Termos de Uso</a>
              <span aria-hidden="true"> · </span>
              <a href={currentLegalDocuments.privacy.href} target="_blank" rel="noreferrer">Política de Privacidade</a>
              . O aceite será registrado com sua conta, versões e data.
            </small>
          </span>
        </label>

        <div className="onboarding-actions">
          <button className="button button--secondary" type="button" onClick={() => setStep(1)}>
            <ArrowLeft size={17} /> Voltar
          </button>
          <FinishButton />
        </div>
      </fieldset>
    </form>
  );
}
