// Prevent React types from being pulled into backend build
declare module "react" {
  export = never;
}
