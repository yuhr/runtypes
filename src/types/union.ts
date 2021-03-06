import { Runtype, RuntypeBase as Rt, Static, create, innerValidate } from '../runtype';
import show from '../show';
import { LiteralBase } from './literal';
import { hasKey, typeOf } from '../util';

export interface Union<A extends readonly [Rt, ...Rt[]]>
  extends Runtype<
    {
      [key in keyof A]: A[key] extends Rt ? Static<A[key]> : unknown;
    }[number]
  > {
  tag: 'union';
  alternatives: A;
  match: Match<A>;
}

/**
 * Construct a union runtype from runtypes for its alternatives.
 */
export function Union<T extends readonly [Rt, ...Rt[]]>(...alternatives: T): Union<T> {
  const match = (...cases: any[]) => (x: any) => {
    for (let i = 0; i < alternatives.length; i++) {
      if (alternatives[i].guard(x)) {
        return cases[i](x);
      }
    }
  };
  const self = { tag: 'union', alternatives, match } as any;
  return create<any>((value, visited) => {
    const commonLiteralFields: { [key: string]: LiteralBase[] } = {};
    for (const alternative of alternatives) {
      if (alternative.reflect.tag === 'record') {
        for (const fieldName in alternative.reflect.fields) {
          const field = alternative.reflect.fields[fieldName];
          if (field.tag === 'literal') {
            if (commonLiteralFields[fieldName]) {
              if (commonLiteralFields[fieldName].every(value => value !== field.value)) {
                commonLiteralFields[fieldName].push(field.value);
              }
            } else {
              commonLiteralFields[fieldName] = [field.value];
            }
          }
        }
      }
    }

    for (const fieldName in commonLiteralFields) {
      if (commonLiteralFields[fieldName].length === alternatives.length) {
        for (const alternative of alternatives) {
          if (alternative.reflect.tag === 'record') {
            const field = alternative.reflect.fields[fieldName];
            if (
              field.tag === 'literal' &&
              hasKey(fieldName, value) &&
              value[fieldName] === field.value
            ) {
              return innerValidate(alternative, value, visited);
            }
          }
        }
      }
    }

    for (const targetType of alternatives) {
      if (innerValidate(targetType, value, visited).success) {
        return { success: true, value };
      }
    }

    return {
      success: false,
      message: `Expected ${show(self)}, but was ${typeOf(value)}`,
    };
  }, self);
}

export interface Match<A extends readonly [Rt, ...Rt[]]> {
  <Z>(...a: { [key in keyof A]: A[key] extends Rt ? Case<A[key], Z> : never }): Matcher<A, Z>;
}

export type Case<T extends Rt, Result> = (v: Static<T>) => Result;

export type Matcher<A extends readonly [Rt, ...Rt[]], Z> = (
  x: {
    [key in keyof A]: A[key] extends Rt<infer Type> ? Type : unknown;
  }[number],
) => Z;
