import { useId, type ComponentProps } from 'react'
import FormField, { type FieldDetails } from '../FormField'
import { fieldDescription } from '../FormField/description'

type SelectFieldProps = ComponentProps<'select'> & FieldDetails

export default function SelectField({ label, hint, error, id, ...props }: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return <FormField id={selectId} label={label} hint={hint} error={error} required={props.required}>
    <select {...props} id={selectId} aria-invalid={error ? true : props['aria-invalid']}
      aria-describedby={fieldDescription(selectId, hint, error, props['aria-describedby'])} />
  </FormField>
}
