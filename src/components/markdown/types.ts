// components/markdown/types.ts
import type { ReactNode } from 'react';

export interface BaseCustomProps {
  children?: ReactNode;
  className?: string;
  color?: string;
  data?: any;
  layout?: any;
  [key: string]: unknown;
}

export type CustomComponent = React.ComponentType<BaseCustomProps>;
export type ComponentRegistry = Record<string, CustomComponent>;

export type Role = 'user' | 'bot' | 'other';
export type RoleComponentMap = Record<Role, ComponentRegistry>;
