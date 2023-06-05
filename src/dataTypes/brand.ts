declare const brand: unique symbol;

export type Brand<K, T> = K & { readonly [brand]: T };
