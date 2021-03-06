import { Runtype } from './index';
import { ValidationError } from './errors';
import { Static } from './runtype';

export interface AsyncContract<A extends readonly Runtype[], R extends Runtype> {
  enforce(
    f: (
      ...args: {
        [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
      }
    ) => Promise<Static<R>>,
  ): (
    ...args: {
      [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
    }
  ) => Promise<Static<R>>;
}

/**
 * Create a function contract.
 */
export function AsyncContract<A extends readonly Runtype[], R extends Runtype>(
  ...runtypes: [...A, R]
): AsyncContract<A, R>;

export function AsyncContract<A extends readonly Runtype[], R extends Runtype>(
  ...runtypes: [...A, R]
): AsyncContract<A, R> {
  const lastIndex = runtypes.length - 1;
  const argRuntypes = (runtypes.slice(0, lastIndex) as unknown) as A;
  const returnRuntype = runtypes[lastIndex] as R;
  return {
    enforce: (
      f: (
        ...args: {
          [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
        }
      ) => Promise<Static<R>>,
    ) => (
      ...args: {
        [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
      }
    ): Promise<Static<R>> => {
      if (args.length < argRuntypes.length)
        throw new ValidationError(
          `Expected ${argRuntypes.length} arguments but only received ${args.length}`,
        );
      for (let i = 0; i < argRuntypes.length; i++) argRuntypes[i].check(args[i]);
      const returnedPromise = f(...args);
      if (!(returnedPromise instanceof Promise))
        throw new ValidationError(
          `Expected function to return a promise, but instead got ${returnedPromise}`,
        );
      return returnedPromise.then(returnRuntype.check);
    },
  };
}
