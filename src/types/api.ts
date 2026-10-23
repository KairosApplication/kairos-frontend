/** JSON LocalDate (YYYY-MM-DD). Validate untrusted input before use. */
export type LocalDateString = string

/** JSON LocalDateTime; the API does not provide an offset or timezone. */
export type LocalDateTimeString = string

/** Null and omitted properties are ignored by the API's partial update services. */
export type PatchRequest<T> = { [Key in keyof T]?: T[Key] | null }

/** GlobalExceptionHandler JSON errors; authentication errors may have no body. */
export type ApiErrorResponse = {
  status: number
  error: string
  message: string
  validationErrors: Record<string, string>
}
