import { myValue } from "my-dep";

// In V1 this is correct (string = string).
// In V2 this is a type error (string = number), but `tsgo --build` will ignore it due to caching!
export const check: string = myValue;
