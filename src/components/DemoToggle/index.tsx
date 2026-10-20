import './styles.css'
type DemoToggleProps = { label: string; checked: boolean; onChange: (checked: boolean) => void }
export default function DemoToggle({ label, checked, onChange }: DemoToggleProps) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="demo-toggle" onClick={() => onChange(!checked)}>
    <span className="demo-toggle__track" aria-hidden="true"><span /></span>
  </button>
}
