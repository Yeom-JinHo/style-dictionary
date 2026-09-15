/**
 * Error that a transform can throw to stop the transform pipeline for the
 * token that is currently being transformed. The error is collected and
 * reported like any other transform error, but no further transforms are
 * applied to that token; it keeps the state it had after the last
 * successfully applied transform.
 */
export class StopTransformError extends Error {
  name = 'StopTransformError';
}

/**
 * Also matches on the error name, so the check keeps working when
 * style-dictionary ends up installed more than once (instanceof fails
 * across module instances) or when consumers throw their own Error
 * subclass with this name.
 * @param {unknown} e
 * @returns {e is StopTransformError}
 */
export function isStopTransformError(e) {
  return e instanceof StopTransformError || (e instanceof Error && e.name === 'StopTransformError');
}
