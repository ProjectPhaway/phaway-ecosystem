import { forwardRef } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper label + input + error, al estilo BDApp2 (form group).
 * Usa `.field` del index.css para el input, asi el wrapper sirve con cualquier
 * children (input, select, textarea, componente controlado).
 */
export function FormField({ label, required, error, hint, htmlFor, children, className }: FormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`block ${className ?? ''}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-alert" aria-hidden>*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-graphite">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-medium text-alert">
          {error}
        </span>
      )}
    </label>
  );
}

interface TextInputProps extends Omit<React.ComponentProps<'input'>, 'className'> {
  invalid?: boolean;
  className?: string;
}

/** Input con la clase `.field` ya aplicada. Permite extender con className extra. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`field ${className ?? ''}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

interface TextAreaProps extends Omit<React.ComponentProps<'textarea'>, 'className'> {
  invalid?: boolean;
  className?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`field ${className ?? ''}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

interface SelectInputProps extends Omit<React.ComponentProps<'select'>, 'className'> {
  invalid?: boolean;
  className?: string;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { invalid, className, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`field ${className ?? ''}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});
