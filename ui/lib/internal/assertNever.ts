/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

/**
 * A typechecking utility function for TypeScript, causing an assertion that
 * a variable's value is impossible (type: never). At runtime, if this statement
 * is encountered, it throws an exception. The optional message string can be
 * used to customize the thrown TypeError's message; the original variable used
 * in the assertion is not modified or accessed in any way.
 *
 * This utility is most useful for writing exhaustiveness checking into
 * TypeScript-checked control flows, such as ensuring that all possible type
 * combinations are covered in long sequences of if statements or all branches
 * of a switch are covered, as in:
 * ```
 * const a: string | null = null;
 * if (typeof a === 'string') {
 *   // ...
 * } else if (a === null) {
 *   // ...
 * } else {
 *   // only works if a's type remains `string | null`. If you add e.g. `| number`
 *   // then the checks above are not exhaustive, and this statement produces a TS
 *   // error
 *   assertNever(a, 'A should never be neither a string nor null');
 * }
 * ```
 */
export function assertNever(any: never, message?: string): never {
  throw new TypeError(message);
}
