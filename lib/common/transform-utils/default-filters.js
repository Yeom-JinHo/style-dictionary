/**
 * @typedef {import('../../../types/DesignToken.d.ts').TransformedToken} Token
 * @typedef {import('../../../types/Config.d.ts').Config} Config
 */

/**
 * @param {Token} token
 * @param {Config} options
 * @returns {boolean}
 */
export function isDimension(token, options) {
  return (options.usesDtcg ? token.$type : token.type) === 'dimension';
}

/**
 * @param {Token} token
 * @param {Config} options
 * @returns {boolean}
 */
export function isFontSize(token, options) {
  return (options.usesDtcg ? token.$type : token.type) === 'fontSize';
}

/**
 * @param {Token} token
 * @param {Config} options
 * @returns {boolean}
 */
export function isAsset(token, options) {
  return (options.usesDtcg ? token.$type : token.type) === 'asset';
}

/**
 * @param {Token} token
 * @param {Config} options
 * @returns {boolean}
 */
export function isContent(token, options) {
  return (options.usesDtcg ? token.$type : token.type) === 'content';
}
