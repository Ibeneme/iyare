// react-grid-layout.d.ts
declare module 'react-grid-layout' {
    import * as React from 'react';
  
    export interface Layout {
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      minW?: number;
      maxW?: number;
      minH?: number;
      maxH?: number;
      static?: boolean;
      isDraggable?: boolean;
      isResizable?: boolean;
    }
  
    export interface GridLayoutProps {
      className?: string;
      style?: React.CSSProperties;
      layout?: Layout[];
      cols?: number;
      rowHeight?: number;
      width?: number;
      margin?: [number, number];
      containerPadding?: [number, number];
      onLayoutChange?: (layout: Layout[]) => void;
      children?: React.ReactNode;
      // Add more props as needed
    }
  
    const GridLayout: React.FC<GridLayoutProps>;
    export default GridLayout;
  }