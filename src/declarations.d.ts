// src/declarations.d.ts
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";

declare namespace JSX {
  interface IntrinsicElements {
    "yare-announcements": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      "api-base"?: string;
      token?: string;
      view?: "banners" | "feed";
      refresh?: number | string;
    };
  }
}
