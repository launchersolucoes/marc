"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateCommission } from "../app/app/comissoes/actions";

const initialState = { error: "", success: "" };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button button--secondary commission-form__submit" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle className="spin" size={15} /> Salvando</> : <><Save size={15} /> Salvar taxa</>}
    </button>
  );
}

export default function CommissionForm({ professional }) {
  const [state, action] = useActionState(updateCommission, initialState);

  return (
    <form className="commission-form" action={action}>
      <input name="professionalId" type="hidden" value={professional.id} />
      <div className="commission-form__identity">
        <span style={{ "--team-color": professional.color || "#ffa500" }}>
          {professional.display_name.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{professional.display_name}</strong>
          <small>A taxa será registrada no momento em que o atendimento for concluído.</small>
        </div>
      </div>
      <label className="commission-rate">
        <span>Comissão</span>
        <span>
          <input
            name="commissionPercent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={Number(professional.commission_percent || 0)}
            aria-label={`Comissão de ${professional.display_name}`}
            required
          />
          <em>%</em>
        </span>
      </label>
      <Submit />
      {state.error && <p className="form-message form-message--error commission-form__message" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success commission-form__message"><CheckCircle2 size={15} />{state.success}</p>}
    </form>
  );
}

