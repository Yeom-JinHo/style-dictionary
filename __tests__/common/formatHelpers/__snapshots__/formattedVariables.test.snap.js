/* @web/test-runner snapshot v1 */
export const snapshots = {};

snapshots["formatHelpers formattedVariables should format variables with CSS format and match snapshot 1"] = 
`  --color-base-red-400: #EF5350;
  --color-base-blue-500: #2196F3;`;
/* end snapshot formatHelpers formattedVariables should format variables with CSS format and match snapshot 1 */

snapshots["formatHelpers formattedVariables should format variables with SASS format and match snapshot 2"] = 
`$color-base-red-400: #EF5350;
$color-base-blue-500: #2196F3;`;
/* end snapshot formatHelpers formattedVariables should format variables with SASS format and match snapshot 2 */

snapshots["formatHelpers formattedVariables should format variables with LESS format and match snapshot 3"] = 
`@color-base-red-400: #EF5350;
@color-base-blue-500: #2196F3;`;
/* end snapshot formatHelpers formattedVariables should format variables with LESS format and match snapshot 3 */

snapshots["formatHelpers formattedVariables should sort variables by name when sort option is \"name\" and match snapshot 4"] = 
`  --color-a: #000000;
  --color-z: #111111;`;
/* end snapshot formatHelpers formattedVariables should sort variables by name when sort option is "name" and match snapshot 4 */

snapshots["formatHelpers formattedVariables should output references when outputReferences=true and match snapshot 5"] = 
`  --color-base-red-400: #EF5350;
  --color-semantic-primary: var(--color-base-red-400);`;
/* end snapshot formatHelpers formattedVariables should output references when outputReferences=true and match snapshot 5 */

