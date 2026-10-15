import { useId, type ComponentProps, type ReactNode } from 'react'
import FormField, { type FieldDetails } from '../FormField'
import { fieldDescription } from '../FormField/description'

type TextFieldProps = ComponentProps<'input'> & FieldDetails & { icon?: ReactNode }

export default function TextField({ label, hint, error, icon, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return <FormField id={inputId} label={label} hint={hint} error={error}>
    <div className="ui-field__control">
      {icon && <span aria-hidden="true">{icon}</span>}
      <input {...props} id={inputId} aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={fieldDescription(inputId, hint, error, props['aria-describedby'])} />
    </div>
  </FormField>
}
